
'use server';

import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Not authorized." }, { status: 401 });
    }

    try {
        const { messageId } = await req.json();

        const member = await prisma.member.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        });
        if (!member) {
            return NextResponse.json({ error: "Member profile not found." }, { status: 404 });
        }

        const message = await prisma.message.findUnique({ where: { id: messageId }});
        if (message?.memberId !== member.id) {
            return NextResponse.json({ error: "Cannot mark message as read for another user." }, { status: 403 });
        }

        await prisma.message.update({ where: { id: messageId }, data: { isRead: true }});
        
        revalidatePath('/inbox');
        
        return NextResponse.json({ success: true, clerkId: userId });

    } catch (error: any) {
        console.error("Error marking message as read:", error);
        return NextResponse.json({ error: error.message || 'Failed to mark message as read.' }, { status: 500 });
    }
}
