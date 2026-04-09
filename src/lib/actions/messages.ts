

'use server';

import { revalidatePath } from 'next/cache';
import { getAdminRole } from '../auth';
import { sendEmail } from '../email';
import type { Member } from '@/types';
import { auth } from '@clerk/nextjs/server';
import prisma from '../prisma';

export async function sendMessage(recipientType: 'all' | 'specific', memberId: string | null, title: string, content: string) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'messaging')) throw new Error("Not authorized for this action.");

    try {
        if (recipientType === 'specific' && memberId) {
            const member = await prisma.member.findFirst({ where: { id: memberId, status: 'Approved' }});
            if (member) {
                await prisma.message.create({
                    data: {
                        memberId: memberId,
                        title: title,
                        content: content,
                    }
                });
                if(member.email) {
                    await sendEmail({
                        to: member.email,
                        subject: `বন্ধন'১৭ থেকে নতুন বার্তা: ${title}`,
                        html: `
                            <h1>নতুন বার্তা</h1>
                            <p>আপনি বন্ধন'১৭ অ্যাডমিন থেকে একটি নতুন বার্তা পেয়েছেন।</p>
                            <p><strong>বিষয়:</strong> ${title}</p>
                            <p><strong>বার্তা:</strong></p>
                            <p>${content}</p>
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/inbox">ইনবক্সে দেখুন</a>
                        `
                    });
                }
            }
        } else if (recipientType === 'all') {
            const allMembers = await prisma.member.findMany({ where: { status: 'Approved' }});
                
            const messages = allMembers.map(member => ({
                memberId: member.id,
                title: title,
                content: content
            }));
            await prisma.message.createMany({ data: messages });

            for (const member of allMembers) {
                if (member.email) {
                    await sendEmail({
                        to: member.email,
                        subject: `বন্ধন'১৭ থেকে নতুন ঘোষণা: ${title}`,
                        html: `
                            <h1>নতুন ঘোষণা</h1>
                            <p>প্রিয় ${member.fullNameEn},</p>
                            <p>সকল সদস্যদের জন্য একটি নতুন ঘোষণা পাঠানো হয়েছে।</p>
                            <p><strong>বিষয়:</strong> ${title}</p>
                            <p><strong>বার্তা:</strong></p>
                            <p>${content}</p>
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/inbox">ইনবক্সে দেখুন</a>
                        `
                    });
                }
            }
        }
        revalidatePath('/admin/messaging');
        revalidatePath('/inbox');
    } catch (error) {
        console.error("Error sending message:", error);
        throw new Error("Failed to send message.");
    }
}

export async function markMessageAsRead(messageId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authorized.");

    try {
        const member = await prisma.member.findUnique({ where: { clerkId: userId }, select: { id: true } });
        if (!member) throw new Error("Member profile not found.");

        const message = await prisma.message.findUnique({ where: { id: messageId }});
        if (message?.memberId !== member.id) {
            throw new Error("Cannot mark message as read for another user.");
        }

        await prisma.message.update({ where: { id: messageId }, data: { isRead: true }});
        revalidatePath('/inbox');
        return { clerkId: userId };
    } catch(error) {
        console.error("Error marking message as read:", error);
        throw new Error("Failed to mark message as read.");
    }
}


export async function sendPaymentReminder(member: Member, month: string) {
    const role = await getAdminRole();
    if (!role || (role !== 'super' && role !== 'transactions')) throw new Error("Not authorized for this action.");

    if (!member.email) {
        throw new Error("This member does not have a registered email address.");
    }

    try {
        const messageContent = `এটি ${month} মাসের মাসিক সঞ্চয়ের পেমেন্টের জন্য একটি সতর্কবার্তা। অনুগ্রহ করে নির্ধারিত সময়ের মধ্যে আপনার পেমেন্ট সম্পন্ন করুন।`;
        const messageTitle = `${month} মাসের পেমেন্ট নোটিশ`;

        await prisma.message.create({
            data: {
                memberId: member.id,
                title: messageTitle,
                content: messageContent,
            }
        });

        await sendEmail({
            to: member.email,
            subject: `বন্ধন'১৭ পেমেন্ট নোটিশ: ${month}`,
            html: `
                <h1>পেমেন্ট নোটিশ</h1>
                <p>প্রিয় ${member.fullNameEn},</p>
                <p>${messageContent}</p>
                <p>আপনি আপনার পেমেন্ট পোর্টালে গিয়ে সহজেই পেমেন্ট সম্পন্ন করতে পারেন।</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment">এখনই পেমেন্ট করুন</a>
            `
        });

        revalidatePath('/inbox');
    } catch (error) {
        console.error("Error sending reminder:", error);
        throw new Error("Failed to send reminder.");
    }
}

export async function sendBulkPaymentReminders(members: Member[], month: string) {
    const role = await getAdminRole();
    if (!role || (role !== 'super' && role !== 'transactions')) throw new Error("Not authorized for this action.");

    try {
        const messageContent = `এটি ${month} মাসের মাসিক সঞ্চয়ের পেমেন্টের জন্য একটি সতর্কবার্তা। অনুগ্রহ করে নির্ধারিত সময়ের মধ্যে আপনার পেমেন্ট সম্পন্ন করুন।`;
        const messageTitle = `${month} মাসের পেমেন্ট নোটিশ`;

        const validMembers = members.filter(m => m.email);

        const inAppMessages = validMembers.map(member => ({
            memberId: member.id,
            title: messageTitle,
            content: messageContent,
        }));

        if (inAppMessages.length > 0) {
            await prisma.message.createMany({ data: inAppMessages });
        }

        for (const member of validMembers) {
            if (member.email) {
                await sendEmail({
                    to: member.email,
                    subject: `বন্ধন'১৭ পেমেন্ট নোটিশ: ${month}`,
                    html: `
                    <h1>পেমেন্ট নোটিশ</h1>
                    <p>প্রিয় ${member.fullNameEn},</p>
                    <p>${messageContent}</p>
                    <p>আপনি আপনার পেমেন্ট পোর্টালে গিয়ে সহজেই পেমেন্ট সম্পন্ন করতে পারেন।</p>
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment">এখনই পেমেন্ট করুন</a>
                `
                });
            }
        }
        revalidatePath('/inbox');
    } catch (error) {
        console.error("Error sending bulk reminders:", error);
        throw new Error("Failed to send bulk reminders.");
    }
}
