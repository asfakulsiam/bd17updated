
'use server';

import { revalidatePath } from 'next/cache';
import { clerkClient, auth } from '@clerk/nextjs/server';
import { getAdminRole } from '@/lib/auth';
import type { Settings } from '@/types';
import { uploadToCloudinary, deleteFromCloudinary } from '../helpers';
import prisma from '../prisma';
import { calculateFinancials } from '../financials.server';


// --- SETTINGS/OTHER ADMIN ACTIONS ---

export async function updateSettings(formData: FormData) {
    const role = await getAdminRole();
    if (role !== 'super') throw new Error("Not authorized for this action.");

    const currentSettings = await prisma.settings.findUnique({ where: { key: 'singleton' } });
    if (!currentSettings) throw new Error("Settings not found");
    
    const data: Partial<Settings> = {
        siteTitle: formData.get('siteTitle') as string,
        minMonthlySavings: Number(formData.get('minMonthlySavings')),
        policyContent: formData.get('policyContent') as string,
        shareValue: Number(formData.get('shareValue')),
        maxSharesPerMember: Number(formData.get('maxSharesPerMember')),
        loanToSavingsRatioNumerator: Number(formData.get('loanToSavingsRatioNumerator')),
        loanToSavingsRatioDenominator: Number(formData.get('loanToSavingsRatioDenominator')),
        loanSystemEnabled: formData.get('loanSystemEnabled') === 'true',
        specialSavingsEnabled: formData.get('specialSavingsEnabled') === 'true',
    };

    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
        if (currentSettings.logoPublicId) {
            await deleteFromCloudinary(currentSettings.logoPublicId);
        }
        const logoUpload = await uploadToCloudinary(logoFile);
        data.logoUrl = logoUpload.secure_url;
        data.logoPublicId = logoUpload.public_id;
    }
    
    await prisma.settings.update({
      where: { key: 'singleton' },
      data
    });

    // PROACTIVE SYNC: Update financials for all approved members to reflect setting changes immediately
    const members = await prisma.member.findMany({
        where: { status: 'Approved' },
        select: { id: true }
    });

    for (const member of members) {
        try {
            await calculateFinancials(member.id);
        } catch (err) {
            console.error(`Failed to sync financials for member ${member.id} after settings update:`, err);
        }
    }

    revalidatePath('/admin/settings');
    revalidatePath('/policy');
    revalidatePath('/payment');
    revalidatePath('/account');
    revalidatePath('/', 'layout');
}


export async function addAdminAction({ email, role: roleToAdd }: { email: string; role: any }) {
    const currentAdminRole = await getAdminRole();
    if (currentAdminRole !== 'super') {
        throw new Error("Not authorized for this action.");
    }

    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ emailAddress: [email] });
    if (users.length === 0) {
        throw new Error("User not found with this email address.");
    }
    const user = users[0];

    await client.users.updateUser(user.id, {
        publicMetadata: { role: 'admin', subrole: roleToAdd }
    });
    
    revalidatePath('/admin/settings');
}

export async function removeAdminAction(id: string) {
    const currentAdminRole = await getAdminRole();
    if (currentAdminRole !== 'super') {
        throw new Error("Not authorized for this action.");
    }
    
    const client = await clerkClient();
    await client.users.updateUser(id, {
        publicMetadata: { role: null, subrole: null }
    });
    
    revalidatePath('/admin/settings');
}


export async function transferShare({ shareId, toMemberId }: { shareId: string, toMemberId: string }) {
    const role = await getAdminRole();
    if (role !== 'super') {
        throw new Error("Only Super Admins can transfer shares.");
    }
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Authentication failed.");
    }

    try {
        const fromMemberId = await prisma.$transaction(async (tx) => {
            const share = await tx.share.findFirst({
                where: { id: shareId, status: { in: ['Active', 'ForTransfer'] } },
            });
            if (!share) {
                throw new Error("Share not found or not available for transfer.");
            }

            const fromMemberId = share.memberId;
            const newOwner = await tx.member.findUnique({ where: { id: toMemberId } });
            if (!newOwner) throw new Error("Could not find the new owner for the transfer.");
            
            await tx.shareTransfer.create({
                data: {
                    shareId,
                    fromMemberId,
                    toMemberId,
                    approvedBy: userId,
                    transferredAt: new Date(),
                }
            });

            await tx.transaction.updateMany({
                where: { shareId: shareId },
                data: { memberId: toMemberId }
            });

            await tx.monthlyPayment.updateMany({
                where: { shareId: shareId },
                data: { memberId: toMemberId }
            });
            
            await tx.share.update({
                where: { id: shareId },
                data: {
                    memberId: toMemberId,
                    status: 'Active',
                    joiningDate: newOwner.joiningDate
                }
            });

            return fromMemberId;
        });
        
        await calculateFinancials(fromMemberId);
        await calculateFinancials(toMemberId);

        revalidatePath(`/admin/members/${fromMemberId}`);
        revalidatePath(`/admin/members/${toMemberId}`);
        revalidatePath('/account/shares');
        revalidatePath('/payment');
        revalidatePath('/transactions');
        revalidatePath('/account');

        return { success: true, fromMemberId };
    } catch (error: any) {
        console.error("Error transferring share:", error);
        throw new Error(error.message || 'Failed to transfer share.');
    }
}
