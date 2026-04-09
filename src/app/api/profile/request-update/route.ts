
'use server';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { notifyAdmins } from '@/lib/notifications';
import { uploadToCloudinary } from '@/lib/helpers';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    
    try {
        const formData = await req.formData();

        const member = await prisma.member.findUnique({
            where: { clerkId: userId },
            select: { id: true, fullNameEn: true }
        });

        if (!member) {
            return NextResponse.json({ error: "Member not found." }, { status: 404 });
        }

        const updateData: { [key: string]: any } = {};
        formData.forEach((value, key) => {
            if (!(value instanceof File)) {
                updateData[key] = value;
            }
        });

        const photoFile = formData.get('photo') as File | null;
        const nidFile = formData.get('nidCopy') as File | null;
        const bankFile = formData.get('bankStatement') as File | null;
        
        if (photoFile && photoFile.size > 0) {
            const { secure_url, public_id } = await uploadToCloudinary(photoFile);
            updateData.photoUrl = secure_url;
            updateData.photoPublicId = public_id;
        }
        if (nidFile && nidFile.size > 0) {
            const { secure_url, public_id } = await uploadToCloudinary(nidFile);
            updateData.nidCopyUrl = secure_url;
            updateData.nidCopyPublicId = public_id;
        }
        if (bankFile && bankFile.size > 0) {
            const { secure_url, public_id } = await uploadToCloudinary(bankFile);
            updateData.bankStatementUrl = secure_url;
            updateData.bankStatementPublicId = public_id;
        }

        const existingUpdate = await prisma.profileUpdate.findFirst({
            where: { memberId: member.id, status: 'Pending' },
        });

        if (existingUpdate) {
            await prisma.profileUpdate.update({ 
                where: { id: existingUpdate.id },
                data: { updateData: JSON.stringify(updateData) }
            });
        } else {
            await prisma.profileUpdate.create({
                data: { memberId: member.id, status: 'Pending', updateData: JSON.stringify(updateData) }
            });
        }

        await notifyAdmins(
            `প্রোফাইল আপডেটের অনুরোধ - ${member.fullNameEn}`,
            `
                <h1>প্রোফাইল আপডেটের অনুরোধ</h1>
                <p>একজন সদস্য তার প্রোফাইল তথ্য পরিবর্তনের জন্য অনুরোধ করেছেন।</p>
                <ul>
                    <li><strong>নাম:</strong> ${member.fullNameEn}</li>
                    <li><strong>সদস্য আইডি:</strong> ${member.id}</li>
                </ul>
                <p>পরিবর্তনগুলো পর্যালোচনা এবং অনুমোদনের জন্য অনুগ্রহ করে অ্যাডমিন ড্যাশবোর্ডে লগইন করুন।</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/dashboard">অনুরোধ পর্যালোচনা করুন</a>
            `,
            ['members']
        );

        revalidatePath('/account/edit');
        revalidatePath('/admin/dashboard');

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error requesting profile update:", error);
        return NextResponse.json({ error: error.message || 'Failed to request update.' }, { status: 500 });
    }
}
