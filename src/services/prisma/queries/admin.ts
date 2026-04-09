
'use server';

import prisma from '@/lib/prisma';
import type { AdminUser, MemberStatus, Event, Settings, PaymentAccount, ProfileUpdate, Member, AdminDashboardStats } from '@/types';
import { clerkClient } from '@clerk/nextjs/server';
import { unstable_noStore as noStore } from 'next/cache';
import { serializeSettings, serializeEvent, serializeMember } from '@/lib/serializers';
import { getAdminRole } from '@/lib/auth';
import { startOfMonth, format, getYear } from 'date-fns';
import { calculateFinancials } from '@/lib/financials.server';

export async function getAdmins(): Promise<AdminUser[]> {
     const client = await clerkClient();
     const users = await client.users.getUserList({ limit: 500 });
     const admins = users.data.filter(u => (u.publicMetadata as any)?.role === 'admin' || (u.publicMetadata as any)?.role === 'super');
     return admins.map(a => ({
         id: a.id,
         name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.emailAddresses[0].emailAddress,
         email: a.emailAddresses[0].emailAddress,
         role: (a.publicMetadata as any).subrole || 'super',
         avatarUrl: a.imageUrl,
     }));
}

export async function getSettings(prismaInstance: any = prisma): Promise<Settings | null> {
    try {
        const settingsRecord = await prismaInstance.settings.upsert({
            where: { key: 'singleton' },
            update: {},
            create: {
                key: 'singleton',
                siteTitle: "Bondhon'17",
                minMonthlySavings: 1000,
                shareValue: 1000,
                policyContent: "Default policy text. Please update in admin settings.",
                maxSharesPerMember: 3,
                loanToSavingsRatioNumerator: 1,
                loanToSavingsRatioDenominator: 3,
                loanSystemEnabled: false,
                specialSavingsEnabled: false,
            }
        });
        return serializeSettings(settingsRecord);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
}

export async function getPaymentAccounts(): Promise<PaymentAccount[]> {
    try {
        const accounts = await prisma.paymentAccount.findMany({
            orderBy: { createdAt: 'asc' }
        });
        return accounts.map(account => ({
            ...account,
            createdAt: account.createdAt.toISOString(),
            updatedAt: account.updatedAt.toISOString(),
        })) as unknown as PaymentAccount[];
    } catch (error) {
        console.error("Error fetching payment accounts:", error);
        return [];
    }
}


export async function getPendingProfileUpdates(): Promise<(ProfileUpdate & { member: { fullNameEn: string } })[]> {
    noStore();
    const role = await getAdminRole();
    if (!role || (role !== 'super' && role !== 'members')) {
        return [];
    }

    const updates = await prisma.profileUpdate.findMany({
        where: { status: 'Pending' },
        include: { member: { select: { fullNameEn: true } } },
        orderBy: { createdAt: 'desc' },
    });
    return updates.map(update => ({
        ...update,
        createdAt: update.createdAt.toISOString(),
        updatedAt: update.updatedAt.toISOString(),
        updateData: JSON.parse(update.updateData as string),
    })) as unknown as (ProfileUpdate & { member: { fullNameEn: string } })[];
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
    noStore();
    const role = await getAdminRole();
    if (!role) {
        return null;
    }

    try {
        const [
            totalMembers,
            approvedMembersCount,
            pendingMemberActions,
            totalSavingsResult,
            totalLoanRepaymentsResult,
            totalOtherPaymentsResult,
            totalLoanDisbursedResult,
            activeLoanResult,
            pendingLoansCount,
            pendingPaymentsCount,
            pendingProfileUpdatesCount,
        ] = await prisma.$transaction([
            prisma.member.count(),
            prisma.member.count({ where: { status: 'Approved' } }),
            prisma.member.count({ where: { status: 'Pending' } }),
            prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: { in: ['MONTHLY_SAVINGS', 'SPECIAL_SAVINGS'] }, status: 'Completed' } }),
            prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'LOAN_REPAYMENT', status: 'Completed' } }),
            prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'OTHER', status: 'Completed', amount: { gt: 0 } } }),
            prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'LOAN_DISBURSEMENT', status: 'Completed' } }),
            prisma.loan.aggregate({ _sum: { amount: true }, where: { loanStatus: 'Active' } }),
            prisma.loan.count({ where: { applicationStatus: 'Pending' } }),
            prisma.approvedPayment.count({ where: { status: 'Pending' } }),
            prisma.profileUpdate.count({ where: { status: 'Pending' } }),
        ]);

        const totalSavings = totalSavingsResult._sum.amount || 0;
        const totalLoanRepayments = totalLoanRepaymentsResult._sum.amount || 0;
        const totalLoanDisbursed = Math.abs(totalLoanDisbursedResult._sum.amount || 0);
        
        const totalCashIn = totalSavings + totalLoanRepayments;
        const totalCash = totalCashIn - totalLoanDisbursed;
        
        const { paid } = await getMonthlyPaymentStatus();
        const paidThisMonthCount = paid.length;

        return {
            totalMembers: totalMembers || 0,
            approvedMembers: approvedMembersCount || 0,
            totalSavingsFund: totalCash,
            activeLoanTotal: activeLoanResult._sum.amount || 0,
            pendingLoansCount: pendingLoansCount || 0,
            pendingPaymentsCount: pendingPaymentsCount || 0,
            pendingMemberActions: pendingMemberActions || 0,
            pendingProfileUpdatesCount: pendingProfileUpdatesCount || 0,
            otherFundsTotal: totalOtherPaymentsResult._sum.amount || 0,
            paidThisMonth: `${paidThisMonthCount}/${approvedMembersCount || 0}`,
            unpaidMembersCount: totalMembers - paidThisMonthCount,
        }
    } catch (e) {
        console.error("Error fetching admin dashboard stats:", e);
        throw new Error("Could not load dashboard statistics.");
    }
}


export async function getActiveEvents(): Promise<Event[]> {
    const now = new Date();
    const events = await prisma.event.findMany({
        where: {
            isActive: true,
            endDate: {
                gte: now,
            },
        },
        orderBy: {
            startDate: 'asc',
        },
    });
    return events.map(serializeEvent);
}


export async function getMonthlyPaymentStatus() {
    noStore();
    const role = await getAdminRole();
    if (!role || (role !== 'super' && role !== 'transactions')) {
        return { paid: [], unpaid: [] };
    }
    
    const allApprovedMembers = await prisma.member.findMany({
        where: { status: 'Approved' }
    });

    const paidMembers: Member[] = [];
    const unpaidMembers: Member[] = [];

    for (const member of allApprovedMembers) {
        if (member.totalDue > 0 || member.currentMonthDue > 0) {
            unpaidMembers.push(member as Member);
        } else {
            paidMembers.push(member as Member);
        }
    }

    return { paid: paidMembers.map(serializeMember), unpaid: unpaidMembers.map(serializeMember) };
}
