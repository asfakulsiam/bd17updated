
'use server';

import prisma from '@/lib/prisma';
import { getSettings } from './admin';
import { calculateFinancials } from '@/lib/financials.server';
import type { Member, Settings, MemberDetailsData, Share, Transaction, Loan } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { unstable_noStore as noStore } from 'next/cache';
import { serializeLoan, serializeMember, serializeSettings, serializeTransaction } from '@/lib/serializers';

export async function getMembersList(status?: Member['status']) {
    noStore();
    const whereClause = status ? { status } : {};
    const members = await prisma.member.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
    });
    return members.map(serializeMember);
}

export async function getMemberById(memberId: string) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return null;
    return serializeMember(member);
}


export async function getUserDetails(clerkOrMemberId?: string): Promise<MemberDetailsData | null> {
  noStore();
  const { userId: authUserId } = await auth();
  let clerkIdToFetch: string | undefined | null = authUserId;

  if (clerkOrMemberId) {
    if (clerkOrMemberId.startsWith('user_')) {
        clerkIdToFetch = clerkOrMemberId;
    } else {
        const memberForId = await prisma.member.findUnique({ where: { id: clerkOrMemberId }, select: { clerkId: true } });
        if (!memberForId) return null;
        clerkIdToFetch = memberForId.clerkId;
    }
  }

  if (!clerkIdToFetch) return null;

  try {
    const member = await prisma.member.findUnique({
      where: { clerkId: clerkIdToFetch },
      include: {
        shares: { orderBy: { createdAt: 'asc' } },
        eventPayments: { select: { event: { select: {id: true} } } },
      }
    });
    if (!member) return null;

    const transactions = await prisma.transaction.findMany({ where: { memberId: member.id }, orderBy: { date: 'asc' } });
    const loans = await prisma.loan.findMany({ where: { memberId: member.id }, include: { guarantor: true, installments: true, }, orderBy: { applicationDate: 'desc' } });
    
    const settings = await getSettings();
    if (!settings) {
        console.error("Critical: Settings not found during getUserDetails call.");
        throw new Error('Settings not found');
    }

    const financials = await calculateFinancials(member.id);

    const totalSavingsAndSystemCredits = transactions
      .filter(t => (t.type === 'MONTHLY_SAVINGS' || t.type === 'SPECIAL_SAVINGS' || (t.type === 'OTHER' && t.isSystem)) && t.status === 'Completed')
      .reduce((s, t) => s + t.amount, 0);

    const loanDisbursements = transactions
      .filter(t => t.type === 'LOAN_DISBURSEMENT' && t.status === 'Completed');

    const totalLoanTaken = loanDisbursements.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const activeLoanAmount = loans.find(l => l.loanStatus === 'Active')?.amount || 0;
    
    const effectiveSavingsForLoan = totalSavingsAndSystemCredits - activeLoanAmount;
    
    const otherPayments = transactions
      .filter(t => t.type === 'OTHER' && t.status === 'Completed' && t.amount > 0 && !t.isSystem)
      .reduce((s, t) => s + t.amount, 0);

    const ratioNumerator = settings.loanToSavingsRatioNumerator || 1;
    const ratioDenominator = settings.loanToSavingsRatioDenominator || 3;
    const loanableAmount = ratioDenominator > 0 ? Math.floor(effectiveSavingsForLoan * (ratioNumerator / ratioDenominator)) : 0;

    const detailsWithComputed = {
      ...serializeMember(member),
      paidEventIds: member.eventPayments.map(p => p.event.id),
    };
    
    return {
      details: detailsWithComputed as any,
      transactions: transactions.map(serializeTransaction),
      loans: loans.map(serializeLoan),
      settings: serializeSettings(settings),
      financials: {
        totalSavings: effectiveSavingsForLoan,
        activeLoan: activeLoanAmount,
        totalLoanTaken,
        otherPayments,
        loanableAmount: Math.max(0, loanableAmount),
        ...financials
      }
    };
  } catch (err: any) {
    console.error(`Error in getUserDetails for clerkId ${clerkIdToFetch}:`, err);
    throw new Error(`A server error occurred while fetching user details: ${err.message}`);
  }
}


export async function getMemberDetails(id: string): Promise<MemberDetailsData | null> {
    noStore();
    return getUserDetails(id);
}
