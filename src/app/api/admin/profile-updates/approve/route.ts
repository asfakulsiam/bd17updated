
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { deleteFromCloudinary } from '@/lib/helpers';
import { sendEmail } from '@/lib/email';
import { getAdmins } from '@/services/prisma/queries/admin';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const { userId } = await auth();
    if (!userId) {
         return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
    }

    try {
        const { updateId } = await req.json();

        const updateRequest = await prisma.profileUpdate.findUnique({
            where: { id: updateId },
            include: { member: true }
        });

        if (!updateRequest) {
            return NextResponse.json({ error: "Profile update request not found or already processed." }, { status: 404 });
        }
        if (updateRequest.status !== 'Pending') {
            return NextResponse.json({ error: "Request already processed." }, { status: 400 });
        }

        const memberId = updateRequest.memberId;
        const dataToUpdate = updateRequest.updateData as { [key: string]: any };
        
        const oldMemberData = updateRequest.member;
        if (dataToUpdate.photoPublicId && oldMemberData.photoPublicId && dataToUpdate.photoPublicId !== oldMemberData.photoPublicId) {
            await deleteFromCloudinary(oldMemberData.photoPublicId);
        }
        if (dataToUpdate.nidCopyPublicId && oldMemberData.nidCopyPublicId && dataToUpdate.nidCopyPublicId !== oldMemberData.nidCopyPublicId) {
            await deleteFromCloudinary(oldMemberData.nidCopyPublicId);
        }
        if (dataToUpdate.bankStatementPublicId && oldMemberData.bankStatementPublicId && dataToUpdate.bankStatementPublicId !== oldMemberData.bankStatementPublicId) {
            await deleteFromCloudinary(oldMemberData.bankStatementPublicId);
        }

        await prisma.member.update({ where: { id: memberId }, data: dataToUpdate });
        
        await prisma.profileUpdate.update({ where: { id: updateId }, data: { status: 'Approved' }});

        if(updateRequest.member.email) {
            const admins = await getAdmins();
            const approver = admins.find(a => a.id === userId);
            let approverName = approver?.name || 'Admin';
            
            await sendEmail({
                to: updateRequest.member.email,
                subject: `আপনার প্রোফাইল আপডেট অনুমোদিত হয়েছে`,
                html: `
                    <h1>প্রোফাইল আপডেট অনুমোদিত</h1>
                    <p>প্রিয় ${updateRequest.member.fullNameEn},</p>
                    <p>আপনার প্রোফাইল পরিবর্তনের অনুরোধ পর্যালোচনা করে অনুমোদন করা হয়েছে।</p>
                    <p><strong>অনুমোদন করেছেন:</strong> ${approverName}</p>
                    <p>আপনি আপনার অ্যাকাউন্টে লগইন করে আপডেট করা প্রোফাইল দেখতে পারেন।</p>
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/account">প্রোফাইল দেখুন</a>
                `
            });
        }

        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/members');
        revalidatePath(`/admin/members/${memberId}`);
        revalidatePath(`/account`);

        return NextResponse.json({ success: true, message: "Profile update approved." });

    } catch (error: any) {
        console.error("Error approving profile update:", error);
        return NextResponse.json({ error: error.message || 'Failed to approve update.' }, { status: 500 });
    }
}
