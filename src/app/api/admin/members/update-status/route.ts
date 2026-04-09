
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { MemberStatus } from '@/models';
import { sendEmail } from '@/lib/email';
import { getAdmins } from '@/services/prisma/queries/admin';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'members')) {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    try {
        const { memberId, status, reason: rejectionReason } = await req.json();
        
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) {
            return NextResponse.json({ error: "Member not found." }, { status: 404 });
        }

        const dataToUpdate: { status: MemberStatus, rejectionReason?: string | null, joiningDate?: Date } = { status };
        const admins = await getAdmins();
        const approver = admins.find(a => a.id === userId);
        const adminName = approver?.name || 'Admin';

        if (status === 'Rejected') {
            const reason = rejectionReason || "কোনো কারণ উল্লেখ করা হয়নি।";
            dataToUpdate.rejectionReason = reason;
            await prisma.message.create({
                data: {
                    memberId: member.id,
                    title: "আপনার নিবন্ধন আবেদনটি বাতিল করা হয়েছে",
                    content: `আপনার আবেদনটি বাতিল করা হয়েছে। কারণ: ${reason}। অনুগ্রহ করে আপনার তথ্য আপডেট করে পুনরায় আবেদন করুন।`
                }
            });
            if(member.email) {
                await sendEmail({
                    to: member.email,
                    subject: `আপনার বন্ধন'১৭ আবেদনের অবস্থা`,
                    html: `
                        <h1>আবেদন বাতিল করা হয়েছে</h1>
                        <p>প্রিয় ${member.fullNameEn},</p>
                        <p>আমরা দুঃখিতভাবে জানাচ্ছি যে, আপনার বন্ধন'১৭-তে নিবন্ধনের আবেদনটি বাতিল করা হয়েছে।</p>
                        <p><strong>কারণ:</strong> ${reason}</p>
                        <p><strong>বাতিল করেছেন:</strong> ${adminName}</p>
                        <p>আপনি আপনার অ্যাকাউন্টে লগইন করে তথ্য পর্যালোচনা এবং আপডেট করে পুনরায় আবেদন করতে পারেন।</p>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/registration">আবেদন আপডেট করুন</a>
                    `
                });
            }
        }
        
        if (status === 'Approved') {
            dataToUpdate.rejectionReason = null;
            if (!member.joiningDate) {
                dataToUpdate.joiningDate = new Date();
            }
            await prisma.message.create({
                data: {
                    memberId: member.id,
                    title: "বন্ধন'১৭-তে স্বাগতম!",
                    content: `অভিনন্দন! আপনার সদস্যপদ অনুমোদিত হয়েছে। আপনি এখন সমস্ত সদস্য সুবিধা অ্যাক্সেস করতে পারবেন।`
                }
            });
            if(member.email) {
                await sendEmail({
                    to: member.email,
                    subject: `স্বাগতম! আপনার বন্ধন'১৭ আবেদন অনুমোদিত হয়েছে`,
                    html: `
                        <h1>আবেদন অনুমোদিত!</h1>
                        <p>প্রিয় ${member.fullNameEn},</p>
                        <p>অভিনন্দন! আপনার বন্ধন'১৭-তে নিবন্ধনের আবেদনটি অনুমোদিত হয়েছে।</p>
                        <p><strong>অনুমোদন করেছেন:</strong> ${adminName}</p>
                        <p>আপনি এখন লগইন করে সঞ্চয়, ঋণের আবেদন এবং আরও অনেক সদস্য সুবিধা অ্যাক্সেস করতে পারবেন।</p>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/account">আপনার অ্যাকাউন্টে যান</a>
                    `
                });
            }
        }

        await prisma.member.update({ where: { id: memberId }, data: dataToUpdate });

        // Comprehensive revalidation
        revalidatePath('/admin/members', 'page');
        revalidatePath(`/admin/members/${memberId}`, 'page');
        revalidatePath('/admin/dashboard', 'page');
        revalidatePath('/account', 'page');
        revalidatePath('/inbox', 'page');
        revalidatePath('/transactions', 'page');

        return NextResponse.json({ success: true, message: `Member status updated to ${status}` });

    } catch (error: any) {
        console.error("Error updating member status:", error);
        return NextResponse.json({ error: error.message || 'Failed to update member status.' }, { status: 500 });
    }
}
