

'use server';

import { revalidatePath } from 'next/cache';
import { getSettings } from '@/services/prisma/queries/admin';
import { ShareStatus } from '@/models';
import prisma, { withRetry } from '../prisma';
import { auth } from '@clerk/nextjs/server';
import { calculateFinancials } from '../financials.server';

export async function createShare(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authorized.");

    try {
        const member = await prisma.member.findUnique({
            where: { clerkId: userId },
            include: { shares: { where: { status: 'Active' }} }
        });

        if (!member) {
            throw new Error("Member not found.");
        }

        const settings = await getSettings();
        if (!settings) {
            throw new Error("Application settings not found.");
        }

        if (member.shares.length >= settings.maxSharesPerMember) {
            throw new Error("You have reached the maximum number of extra members.");
        }
        
        const data = {
            memberId: member.id,
            sharerName: formData.get('sharerName') as string,
            sharerNid: formData.get('sharerNid') as string,
            sharerPhone: formData.get('sharerPhone') as string,
            sharerAddress: formData.get('sharerAddress') as string,
            status: 'Active' as ShareStatus,
            joiningDate: member.joiningDate, // Inherit joining date from the owner
        };
        
        await prisma.share.create({ data });
        
        await calculateFinancials(member.id);

        revalidatePath('/account/shares');
        revalidatePath('/account');
        revalidatePath('/payment');
    } catch (error) {
        console.error("Error creating share:", error);
        throw new Error("Failed to create share.");
    }
}

export async function updateShare(shareId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authorized.");

    try {
        const share = await prisma.share.findFirst({
            where: { 
                id: shareId,
                member: {
                    clerkId: userId
                }
            },
        });

        if (!share) {
            throw new Error("You can only update your own extra members.");
        }

        const data = {
            sharerName: formData.get('sharerName') as string,
            sharerNid: formData.get('sharerNid') as string,
            sharerPhone: formData.get('sharerPhone') as string,
            sharerAddress: formData.get('sharerAddress') as string,
        };

        await prisma.share.update({ where: { id: shareId }, data });
        
        revalidatePath('/account/shares');
    } catch (error) {
        console.error("Error updating share:", error);
        throw new Error("Failed to update share.");
    }
}


export async function updateShareStatus({ shareId, status }: { shareId: string, status: ShareStatus }) {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authorized.");

    try {
        const share = await prisma.share.findFirst({
            where: { 
                id: shareId,
                member: {
                    clerkId: userId
                }
            },
            select: { id: true, memberId: true, member: { select: { clerkId: true } } }
        });

        if (!share) {
            throw new Error("You can only update your own shares.");
        }

        if (status === 'Removed') {
            const result = await convertShareToAdvance(shareId);
            return { success: true, ...result };
        }

        await prisma.share.update({ where: { id: shareId }, data: { status }});
        
        revalidatePath('/account/shares');
        revalidatePath('/account');
        revalidatePath('/payment');
        
        return { success: true, memberId: share.memberId, clerkId: share.member.clerkId };

    } catch (error) {
        console.error("Error updating share status:", error);
        throw new Error("Failed to update share status.");
    }
}

export async function convertShareToAdvance(shareId: string) {
    return withRetry(async (tx) => {
        const share = await tx.share.findUnique({
            where: { id: shareId },
            include: { member: true }
        });
        if (!share) throw new Error("Share not found.");
        if (share.status === 'Converted') throw new Error("Share has already been converted.");
        
        const monthlyPaymentsForShare = await tx.monthlyPayment.findMany({
            where: { shareId: share.id }
        });

        let paidForShare = monthlyPaymentsForShare.reduce((sum: number, payment: any) => sum + payment.paid, 0);

        await tx.member.update({
            where: { id: share.memberId },
            data: {
                advanceBalance: {
                    increment: paidForShare
                }
            }
        });
        
        await tx.share.update({
            where: { id: shareId },
            data: { status: 'Converted', convertedAt: new Date() }
        });
        
        // This is crucial: Recalculate financials immediately to apply the new advance balance
        await calculateFinancials(share.memberId, tx);

        revalidatePath(`/admin/members/${share.memberId}`);
        revalidatePath('/account/shares');
        revalidatePath('/payment');
        revalidatePath('/account');
        revalidatePath('/transactions');

        return { success: true, memberId: share.memberId, clerkId: share.member.clerkId, creditedAmount: paidForShare };
    });
}
