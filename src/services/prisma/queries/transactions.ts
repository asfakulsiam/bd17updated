
'use server';

import prisma from '@/lib/prisma';
import type { Transaction, TransactionStatus, ApprovedPayment } from '@/types';
import type { Payment } from '@/types/payment';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getAdminRole } from '@/lib/auth';

async function resolveAdminNames(transactions: (Transaction[] | ApprovedPayment[])) {
    const adminIds = [...new Set(transactions.map(t => t.approvedBy).filter(Boolean) as string[])];
    if (adminIds.length === 0) return {};
    
    try {
        const client = await clerkClient();
        const admins = await client.users.getUserList({ userId: adminIds });
        const adminNameMap: Record<string, string> = {};
        admins.data.forEach(admin => {
            const fullName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim();
            adminNameMap[admin.id] = fullName || admin.emailAddresses[0]?.emailAddress || admin.id;
        });
        return adminNameMap;
    } catch (error) {
        console.error("Could not resolve admin names from Clerk:", error);
        const adminNameMap: Record<string, string> = {};
        adminIds.forEach(id => { adminNameMap[id] = 'Admin'; });
        return adminNameMap;
    }
}

export async function getUserPaymentHistory(): Promise<Payment[]> {
    const { userId } = await auth();
    if (!userId) return [];
    
    const member = await prisma.member.findUnique({ where: { clerkId: userId }, select: { id: true, fullNameEn: true, mobilePrimary: true } });
    if (!member) return [];

    const transactions = await prisma.transaction.findMany({
        where: { memberId: member.id },
        orderBy: { date: 'desc' }
    });

    const adminNameMap = await resolveAdminNames(transactions as Transaction[]);

    return transactions.map((t: any): Payment => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        transactionId: t.transactionId,
        status: t.status as TransactionStatus,
        name: member.fullNameEn || '',
        memberId: t.memberId,
        approvedBy: t.approvedBy ? adminNameMap[t.approvedBy] || t.approvedBy : undefined,
        phone: member.mobilePrimary ?? undefined,
        paymentType: t.type,
        paymentMethod: t.paymentMethod,
        reason: t.reason ?? undefined,
        paymentForMonth: t.paymentForMonth
    }));
}

export async function getAllTransactions(status?: TransactionStatus): Promise<Payment[]> {
    const role = await getAdminRole();
    if (!role) return [];

    const where: any = {};
    if (status) {
        where.status = status;
    }

    const transactions = await prisma.transaction.findMany({
        where,
        include: { member: { select: { fullNameEn: true, mobilePrimary: true }}},
        orderBy: { date: 'desc' }
    });
    
    const adminNameMap = await resolveAdminNames(transactions as Transaction[]);

    return transactions.map((t: any): Payment => {
        return {
            id: t.id,
            date: t.date,
            name: t.member.fullNameEn,
            memberId: t.memberId,
            phone: t.member.mobilePrimary ?? undefined,
            amount: t.amount,
            transactionId: t.transactionId,
            status: t.status as TransactionStatus,
            paymentType: t.type,
            paymentMethod: t.paymentMethod,
            reason: t.reason ?? undefined,
            senderNumber: t.senderNumber ?? undefined,
            approvedBy: t.approvedBy ? adminNameMap[t.approvedBy] || t.approvedBy : undefined,
            paymentForMonth: t.paymentForMonth,
        }
    });
}

export async function getPendingPayments(): Promise<ApprovedPayment[]> {
    const role = await getAdminRole();
    if (!role || (role !== 'super' && role !== 'transactions')) {
        return [];
    }

    const pending = await prisma.approvedPayment.findMany({
        where: { status: 'Pending' },
        include: { member: { select: { fullNameEn: true, mobilePrimary: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return pending.map((p: any) => ({
        id: p.id,
        memberId: p.memberId,
        name: p.member.fullNameEn,
        phone: p.member.mobilePrimary,
        amount: p.amount,
        type: p.type,
        status: p.status,
        paymentForMonth: p.paymentForMonth,
        transactionId: p.transactionId,
        notes: p.notes,
        paymentMethod: p.paymentMethod,
        senderNumber: p.senderNumber,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        eventId: p.eventId,
    }));
}
