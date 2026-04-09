

import type { Loan, Transaction, Member, Settings, Share } from '@/types';

export type MemberDetailsData = {
    details: Member;
    financials: {
        totalDue: number;
        currentMonthDue: number;
        advanceBalance: number;
        totalLoanDue: number;
        currentMonthLoanDue: number;
        monthlyBreakdown: Record<string, { expected: number; paid: number }>;
        entityLedgers: Record<string, { name: string; breakdown: Record<string, { expected: number; paid: number; }>; advance: number; }>;
        
        totalSavings: number;
        activeLoan: number;
        totalLoanTaken: number;
        otherPayments: number;
        loanableAmount: number;
    };
    transactions: Transaction[];
    loans: Loan[];
    settings: Settings;
};
