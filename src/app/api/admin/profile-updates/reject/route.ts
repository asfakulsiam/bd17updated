
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    try {
        const { updateId } = await req.json();

        const updateRequest = await prisma.profileUpdate.findUnique({
            where: { id: updateId },
            include: { member: { select: { email: true, fullNameEn: true } } }
        });
        
        if (!updateRequest) {
            return NextResponse.json({ error: "Update request not found." }, { status: 404 });
        }

        await prisma.profileUpdate.update({ where: { id: updateId }, data: { status: 'Rejected' } });
        
        if (updateRequest.member.email) {
            await sendEmail({
                to: updateRequest.member.email,
                subject: `আপনার প্রোফাইল আপডেট অনুরোধের অবস্থা`,
                html: `
                    <h1>প্রোফাইল আপডেট বাতিল</h1>
                    <p>প্রিয় ${updateRequest.member.fullNameEn},</p>
                    <p>দুঃখিত, আপনার প্রোফাইল তথ্য আপডেটের সাম্প্রতিক অনুরোধটি এই মুহূর্তে অনুমোদন করা সম্ভব হয়নি।</p>
                    <p>আপনি যদি মনে করেন এটি একটি ভুল, অনুগ্রহ করে একজন অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
                `
            });
        }
        
        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/members');

        return NextResponse.json({ success: true, message: "Profile update rejected." });

    } catch (error: any) {
        console.error("Error rejecting profile update:", error);
        return NextResponse.json({ error: error.message || 'Failed to reject update.' }, { status: 500 });
    }
}
