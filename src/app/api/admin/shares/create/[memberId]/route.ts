

import prisma from '@/lib/prisma';
import { getAdminRole } from '@/lib/auth';
import { getSettings } from '@/services/prisma/queries/admin';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ShareStatus } from '@/types';
import { calculateFinancials } from '@/lib/financials.server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const { memberId } = await params;

    try {
        const formData = await req.formData();
        const member = await prisma.member.findUnique({ 
            where: { id: memberId },
            include: { shares: { where: { status: 'Active' }}}
        });
        if (!member) {
            return NextResponse.json({ error: "Member not found." }, { status: 404 });
        }
        
        const settings = await getSettings();
        if (!settings) {
            return NextResponse.json({ error: "Application settings not found." }, { status: 500 });
        }

        if (member.shares.length >= settings.maxSharesPerMember) {
            return NextResponse.json({ error: "Member has reached the maximum number of extra members." }, { status: 400 });
        }
        
        await prisma.share.create({
            data: {
                memberId,
                sharerName: formData.get('sharerName') as string,
                sharerNid: formData.get('sharerNid') as string,
                sharerPhone: formData.get('sharerPhone') as string,
                sharerAddress: formData.get('sharerAddress') as string,
                status: 'Active' as ShareStatus,
                joiningDate: new Date(), // Set joining date to now
            }
        });
        
        // Recalculate financials to include the new share
        await calculateFinancials(memberId);

        revalidatePath(`/admin/members/${memberId}`);
        revalidatePath('/account/shares');
        revalidatePath('/account');
        return NextResponse.json({ success: true, message: 'Share added successfully.' });
    } catch (error: any) {
        console.error("Error adding share:", error);
        return NextResponse.json({ error: error.message || 'Failed to add share.' }, { status: 500 });
    }
}
