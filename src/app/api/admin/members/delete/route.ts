
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    const role = await getAdminRole();
    if (role !== 'super') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    try {
        const { memberId } = await req.json();
        const member = await prisma.member.findUnique({
            where: { id: memberId },
            select: { clerkId: true }
        });
        
        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // The transaction will ensure all operations succeed or fail together.
        await prisma.$transaction(async (tx) => {
            // Delete all dependent records first in the correct order
            await tx.monthlyPayment.deleteMany({ where: { memberId: memberId } });
            await tx.loanInstallment.deleteMany({ where: { loan: { memberId: memberId } } });
            await tx.share.deleteMany({ where: { memberId: memberId } });
            await tx.guarantor.deleteMany({ where: { loan: { memberId: memberId } } });
            await tx.loan.deleteMany({ where: { memberId: memberId } });
            await tx.transaction.deleteMany({ where: { memberId: memberId } });
            await tx.approvedPayment.deleteMany({ where: { memberId: memberId } });
            await tx.message.deleteMany({ where: { memberId: memberId } });
            await tx.profileUpdate.deleteMany({ where: { memberId: memberId } });
            await tx.eventPayment.deleteMany({ where: { memberId: memberId } });

            // After all dependents are gone, delete the member itself
            await tx.member.delete({ where: { id: memberId } });
            
            // Finally, delete the user from Clerk
            const client = await clerkClient();
            await client.users.deleteUser(member.clerkId);
        });
        
        revalidatePath('/admin/members');
        return NextResponse.json({ success: true, message: "Member and all associated data deleted successfully." });

    } catch (error: any) {
        console.error("Error deleting member:", error);
        return NextResponse.json({ error: error.message || 'Failed to delete member.' }, { status: 500 });
    }
}
