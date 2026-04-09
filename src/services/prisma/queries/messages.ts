

'use server';

import prisma from '@/lib/prisma';
import type { Message, UnreadCounts } from '@/types';
import { auth } from '@clerk/nextjs/server';

export async function getMessagesForUser(): Promise<Message[]> {
    const { userId } = await auth();
    if (!userId) return [];
    
    try {
        const member = await prisma.member.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        });
        if (!member) return [];

        const data = await prisma.message.findMany({
            where: { memberId: member.id },
            orderBy: { sentAt: 'desc' }
        });
        
        return data.map(m => ({...m, sentAt: m.sentAt.toISOString()})) as Message[];
    } catch (error) {
        console.error("Error fetching messages for user:", error);
        return [];
    }
}

export async function getUnreadCounts(): Promise<UnreadCounts> {
    const { userId } = await auth();
    if (!userId) return { inbox: 0, notices: 0 };
    
    try {
        const member = await prisma.member.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        });
        if (!member) return { inbox: 0, notices: 0 };

        const inboxCount = await prisma.message.count({
            where: {
                memberId: member.id,
                isRead: false
            }
        });

        // For now, we are not tracking unread notices per user, so we return 0.
        const noticesCount = 0; 
        
        return { inbox: inboxCount, notices: noticesCount };
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        return { inbox: 0, notices: 0 };
    }
}
