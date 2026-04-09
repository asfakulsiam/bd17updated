
'use server';

import prisma from '@/lib/prisma';
import type { LoanWithDetails, OrgLoanData, UserLoanData } from '@/types';
import { getSettings } from './admin';
import { serializeLoan } from '@/lib/serializers';
import { auth } from '@clerk/nextjs/server';
import { getUserDetails } from './members';

export async function getUserLoanData(clerkId?: string): Promise<UserLoanData | null> {
    const { userId: authUserId } = await auth();
    const currentClerkId = clerkId || authUserId;

    if (!currentClerkId) return null;

    try {
      const userDetails = await getUserDetails(currentClerkId);
      if (!userDetails) return null;

      const { details, financials, loans } = userDetails;
      
      const activeLoan = loans.find(l => l.loanStatus === 'Active');
      const loansThisYear = loans.filter(l => new Date(l.applicationDate).getFullYear() === new Date().getFullYear()).length;
      
      const applicationPending = !!(await prisma.loan.findFirst({
        where: { memberId: details.id, applicationStatus: 'Pending' }
      }));

      return {
        hasLoan: !!activeLoan,
        loanAmount: activeLoan?.amount || 0,
        repaidAmount: activeLoan?.repaidAmount || 0,
        repaymentPeriod: activeLoan?.repaymentPeriod || 0,
        approvalDate: activeLoan?.approvalDate ?? null,
        applicationPending,
        loanApplicationsThisYear: loansThisYear,
        maxLoanableAmount: financials.loanableAmount,
        totalSavings: financials.totalSavings,
        totalLoanDue: financials.totalLoanDue,
        currentMonthLoanDue: financials.currentMonthLoanDue,
      };

    } catch (error) {
        console.error("Error fetching user loan data:", error);
        return null;
    }
}


export async function getOrganizationLoanData(): Promise<OrgLoanData> {
    try {
        const totalSavingsResult = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: { in: ['MONTHLY_SAVINGS', 'SPECIAL_SAVINGS'] }, status: 'Completed' }
        });
        const totalLoanRepaymentsResult = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: 'LOAN_REPAYMENT', status: 'Completed' }
        });
        const totalOtherPaymentsResult = await prisma.transaction.aggregate({
             _sum: { amount: true },
            where: { type: 'OTHER', status: 'Completed', amount: { gt: 0 } }
        });
        const totalLoanDisbursedResult = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: 'LOAN_DISBURSEMENT', status: 'Completed' }
        });
        
        const totalSavings = totalSavingsResult._sum.amount || 0;
        const totalLoanRepayments = totalLoanRepaymentsResult._sum.amount || 0;
        const totalLoanDisbursed = Math.abs(totalLoanDisbursedResult._sum.amount || 0);
        
        const totalCashIn = totalSavings + totalLoanRepayments;
        const totalCash = totalCashIn - totalLoanDisbursed;

        const activeLoans = await prisma.loan.findMany({
            where: { loanStatus: 'Active' },
            include: { member: { select: { fullNameEn: true } } }
        });

        const totalLoanedOut = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);

        return {
            organizationTotalFund: totalCash,
            organizationOtherFunds: totalOtherPaymentsResult._sum.amount || 0,
            activeLoans: activeLoans.map(serializeLoan),
            totalLoanedOut: totalLoanedOut,
        };
    } catch (error) {
        console.error("Error fetching organization loan data:", error);
        return {
            organizationTotalFund: 0,
            organizationOtherFunds: 0,
            activeLoans: [],
            totalLoanedOut: 0,
        };
    }
}


export async function getLoanApplications(): Promise<LoanWithDetails[]> {
    const loans = await prisma.loan.findMany({
        include: {
            member: { select: { fullNameEn: true } },
            guarantor: true,
            installments: true,
        },
        orderBy: { applicationDate: 'desc' },
    });

    return loans.map(serializeLoan) as unknown as LoanWithDetails[];
}
