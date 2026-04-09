
'use server';

import prisma, { withRetry } from '@/lib/prisma';
import { eachMonthOfInterval, getYear, addMonths, isBefore, startOfMonth, isSameMonth, format } from 'date-fns';
import { unstable_noStore as noStore } from 'next/cache';
import { getSettings } from '@/services/prisma/queries/admin';

/**
 * Creates or updates a monthly payment record.
 * If settings have changed, it updates the expected amount for the current month.
 */
async function createOrUpdateMonthlyPayment(
  prismaTx: any,
  memberId: string,
  monthDate: Date,
  expected: number,
  shareId: string | null = null
) {
  // Use explicit equals for null to correctly handle primary member vs shares
  const existing = await prismaTx.monthlyPayment.findFirst({
      where: { memberId, month: monthDate, shareId: { equals: shareId } },
  });

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const isCurrentOrFutureMonth = monthDate >= currentMonthStart;

  if (existing) {
    // If it's the current or a future month and the expected amount doesn't match settings, update it.
    if (isCurrentOrFutureMonth && existing.expected !== expected) {
        return prismaTx.monthlyPayment.update({
            where: { id: existing.id },
            data: { 
                expected,
                status: existing.paid >= expected ? 'Paid' : (existing.paid > 0 ? 'Partial' : 'Due')
            }
        });
    }
    return null; 
  }

  return prismaTx.monthlyPayment.create({
    data: {
      memberId,
      shareId,
      month: monthDate,
      expected,
      paid: 0,
      status: 'Due',
    },
  });
}

async function createOrUpdateLoanInstallment(
    prismaTx: any,
    loanId: string,
    monthDate: Date,
    expected: number
) {
    const existing = await prismaTx.loanInstallment.findFirst({
        where: { loanId, month: monthDate }
    });
    
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const isCurrentOrFutureMonth = monthDate >= currentMonthStart;

    if (existing) {
        if (isCurrentOrFutureMonth && existing.expected !== expected) {
            return prismaTx.loanInstallment.update({
                where: { id: existing.id },
                data: {
                    expected,
                    status: existing.paid >= expected ? 'Paid' : (existing.paid > 0 ? 'Partial' : 'Due')
                }
            });
        }
        return null;
    }

    return prismaTx.loanInstallment.create({
        data: { loanId, month: monthDate, expected, paid: 0, status: 'Due' }
    });
}

/**
 * The core financial engine. It generates due records and updates member summary totals.
 * Handles synchronization between admin settings and current monthly requirements.
 */
export async function calculateFinancials(memberId: string, pTx?: any) {
    noStore();

    const execute = async (prismaTx: any) => {
        const member = await prismaTx.member.findUnique({
            where: { id: memberId },
            include: {
                shares: { where: { status: { in: ['Active', 'ForTransfer'] } }, orderBy: { createdAt: 'asc' } },
                loans: { where: { loanStatus: 'Active' }, include: { installments: true } },
            }
        });

        if (!member) throw new Error("Member not found");
        if (!member.joiningDate) return { totalDue: 0, currentMonthDue: 0, advanceBalance: 0, monthlyBreakdown: {}, entityLedgers: {} };
        
        const settings = await getSettings(prismaTx);
        if (!settings) throw new Error("Settings not found");
        
        // Robust society start date definition
        const societyStartDate = new Date(Date.UTC(2025, 7, 1)); 
        const creationPromises: Promise<any>[] = [];
        const currentMonthForCalc = startOfMonth(new Date());

        // 1. Primary Member Dues
        let effectiveStartDate: Date;
        if (member.joiningType === 'Old') {
            effectiveStartDate = societyStartDate;
        } else {
            const memberJoiningDate = new Date(member.joiningDate!);
            const memberJoiningYear = getYear(memberJoiningDate);
            effectiveStartDate = (memberJoiningYear <= 2025) 
                ? societyStartDate 
                : startOfMonth(new Date(Date.UTC(memberJoiningYear, 0, 1)));
        }
        
        const monthsToProcessPrimary = eachMonthOfInterval({ start: effectiveStartDate, end: currentMonthForCalc });
        for (const monthDate of monthsToProcessPrimary) {
            const promise = createOrUpdateMonthlyPayment(prismaTx, member.id, monthDate, settings.minMonthlySavings, null);
            if (promise) creationPromises.push(promise);
        }
        
        // 2. Extra Shares Dues
        for (const share of member.shares) {
            const shareJoiningDate = startOfMonth(new Date(share.joiningDate));
            const shareMonthsToProcess = eachMonthOfInterval({ start: shareJoiningDate, end: currentMonthForCalc });
            for (const monthDate of shareMonthsToProcess) {
                const promise = createOrUpdateMonthlyPayment(prismaTx, member.id, monthDate, settings.shareValue, share.id);
                if (promise) creationPromises.push(promise);
            }
        }
        
        // 3. Loan Installments
        for (const loan of member.loans) {
            if (!loan.approvalDate) continue;
            const loanDuesStartMonth = addMonths(startOfMonth(new Date(loan.approvalDate)), 1);
            const installmentAmount = Math.ceil(loan.amount / loan.repaymentPeriod);
            
            if (!isBefore(currentMonthForCalc, loanDuesStartMonth)) {
                const loanMonthsToProcess = eachMonthOfInterval({ start: loanDuesStartMonth, end: currentMonthForCalc });
                for (const monthDate of loanMonthsToProcess) {
                    const promise = createOrUpdateLoanInstallment(prismaTx, loan.id, monthDate, installmentAmount);
                    if(promise) creationPromises.push(promise);
                }
            }
        }
        
        // Wait for all records to be created/updated before totaling
        await Promise.all(creationPromises);

        // --- 4. Use Advance Balance to pay off older dues automatically ---
        let currentAdvance = member.advanceBalance;
        if (currentAdvance > 0) {
            const allUnpaid = await prismaTx.monthlyPayment.findMany({
                where: { memberId, status: { not: 'Paid' } },
                orderBy: { month: 'asc' }
            });

            for (const due of allUnpaid) {
                if (currentAdvance <= 0) break;
                const deficit = due.expected - due.paid;
                if (deficit > 0) {
                    const toPay = Math.min(currentAdvance, deficit);
                    await prismaTx.monthlyPayment.update({
                        where: { id: due.id },
                        data: {
                            paid: { increment: toPay },
                            status: (due.paid + toPay) >= due.expected ? 'Paid' : 'Partial'
                        }
                    });
                    currentAdvance -= toPay;

                    // Create a zero-amount audit transaction record
                    const monthName = format(due.month, 'MMMM yyyy');
                    await prismaTx.transaction.create({
                        data: {
                            memberId,
                            amount: 0, // Zero amount prevents double counting
                            type: 'MONTHLY_SAVINGS',
                            status: 'Completed',
                            date: new Date(),
                            reason: `Auto-payment of ৳${toPay} from advance for ${monthName}`,
                            paymentMethod: 'System',
                            transactionId: `SYS-ADVANCE-${member.id.slice(-5)}-${Date.now()}`,
                            isSystem: true,
                            approvedBy: 'SYSTEM'
                        }
                    });
                }
            }

            // Sync updated advance balance back to member record
            if (currentAdvance !== member.advanceBalance) {
                await prismaTx.member.update({
                    where: { id: memberId },
                    data: { advanceBalance: currentAdvance }
                });
            }
        }

        // --- 5. Recalculate Summary Totals and Detailed Breakdown ---
        const allMonthlyPayments = await prismaTx.monthlyPayment.findMany({ 
            where: { memberId },
            include: { share: true }
        });

        let totalDue = 0;
        let currentMonthDue = 0;
        const monthlyBreakdown: Record<string, { expected: number; paid: number }> = {};
        const entityLedgers: Record<string, { name: string; breakdown: Record<string, { expected: number; paid: number; }>; advance: number; }> = {
            "primary": { name: member.fullNameEn || "Primary Member", breakdown: {}, advance: 0 }
        };

        allMonthlyPayments.forEach((p: any) => {
            const monthKey = format(p.month, 'yyyy-MM');
            const entityId = p.shareId || "primary";
            
            if (!monthlyBreakdown[monthKey]) monthlyBreakdown[monthKey] = { expected: 0, paid: 0 };
            monthlyBreakdown[monthKey].expected += p.expected;
            monthlyBreakdown[monthKey].paid += p.paid;

            if (!entityLedgers[entityId]) {
                entityLedgers[entityId] = { name: p.share?.sharerName || "Extra Share", breakdown: {}, advance: 0 };
            }
            entityLedgers[entityId].breakdown[monthKey] = { expected: p.expected, paid: p.paid };

            const deficit = Math.max(0, p.expected - p.paid);
            if (isSameMonth(p.month, currentMonthForCalc)) {
                currentMonthDue += deficit;
            } else if (isBefore(p.month, currentMonthForCalc)) {
                totalDue += deficit;
            }
        });

        // Update the member record summary fields for fast retrieval elsewhere
        const updatedMember = await prismaTx.member.update({
            where: { id: memberId },
            data: {
                totalDue,
                currentMonthDue,
            }
        });

        return {
            totalDue,
            currentMonthDue,
            advanceBalance: updatedMember.advanceBalance,
            monthlyBreakdown,
            entityLedgers
        };
    };

    // Use provided transaction or run within withRetry wrapper
    if (pTx) {
        return execute(pTx);
    } else {
        return withRetry(execute);
    }
}

export async function allocateSavingsPayment(input: {
  prismaTx: any;
  memberId: string;
  amount: number;
  transactionId?: string | null;
  paymentMethod: string;
  senderNumber?: string | null;
  notes?: string | null;
  approvedBy: string;
  paymentForMonth: { month: string; shareId: string | null } | null;
}) {
  const { prismaTx, memberId, amount, transactionId, paymentMethod, senderNumber, notes, approvedBy, paymentForMonth } = input;

  const member = await prismaTx.member.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Member not found");

  let paymentPool = amount;
  
  // 1. Create the primary transaction record (The actual financial incoming)
  await prismaTx.transaction.create({
    data: {
      memberId,
      amount,
      type: 'MONTHLY_SAVINGS',
      status: 'Completed',
      date: new Date(),
      reason: paymentForMonth ? `Payment for ${paymentForMonth.month}` : notes,
      transactionId,
      paymentMethod,
      senderNumber,
      approvedBy,
    }
  });

  // 2. Prioritize payment for a specific month if requested by user
  if (paymentForMonth) {
    const targetMonth = startOfMonth(new Date(paymentForMonth.month));
    const duesForTargetMonth = await prismaTx.monthlyPayment.findMany({
      where: { 
          memberId, 
          month: targetMonth, 
          status: { not: 'Paid' }, 
          shareId: { equals: paymentForMonth.shareId } 
      },
    });

    for (const due of duesForTargetMonth) {
      if (paymentPool <= 0) break;
      const deficit = due.expected - due.paid;
      if (deficit > 0) {
        const toPay = Math.min(paymentPool, deficit);
        await prismaTx.monthlyPayment.update({
          where: { id: due.id },
          data: { paid: { increment: toPay }, status: (due.paid + toPay) >= due.expected ? 'Paid' : 'Partial' },
        });
        paymentPool -= toPay;
      }
    }
  }

  // 3. Automatically clear oldest past dues with any remaining funds
  if (paymentPool > 0) {
      const oldestDues = await prismaTx.monthlyPayment.findMany({
          where: { memberId, status: { not: 'Paid' }, month: { lt: startOfMonth(new Date()) } },
          orderBy: { month: 'asc' },
      });

      for (const due of oldestDues) {
          if (paymentPool <= 0) break;
          const deficit = due.expected - due.paid;
          if (deficit > 0) {
              const toPay = Math.min(paymentPool, deficit);
              await prismaTx.monthlyPayment.update({
                  where: { id: due.id },
                  data: { paid: { increment: toPay }, status: (due.paid + toPay) >= due.expected ? 'Paid' : 'Partial' },
              });
              paymentPool -= toPay;
          }
      }
  }

  // 4. Any leftover amount goes to member's advance balance
  if (paymentPool > 0) {
    await prismaTx.member.update({
      where: { id: memberId },
      data: { advanceBalance: { increment: paymentPool } }
    });
  }
}

export async function allocateLoanRepayment(input: {
    prismaTx: any;
    memberId: string;
    amount: number;
    transactionId?: string | null;
    paymentMethod: string;
    senderNumber?: string | null;
    notes?: string | null;
    approvedBy: string;
}) {
    const { prismaTx, memberId, amount, transactionId, paymentMethod, senderNumber, notes, approvedBy } = input;
    
    let remainingAmount = amount;
    
    const unpaidInstallments = await prismaTx.loanInstallment.findMany({
        where: { loan: { memberId, loanStatus: 'Active' }, status: { not: 'Paid' } },
        orderBy: { month: 'asc' },
    });

    if (unpaidInstallments.length === 0) {
        const activeLoan = await prismaTx.loan.findFirst({
            where: { memberId, loanStatus: 'Active' }
        });

        if (!activeLoan) {
             throw new Error("No active loan or outstanding loan installments found.");
        }

        await prismaTx.transaction.create({
            data: { memberId, loanId: activeLoan.id, amount, type: 'LOAN_REPAYMENT', status: 'Completed', date: new Date(), transactionId, paymentMethod, senderNumber, reason: notes, approvedBy }
        });

        await prismaTx.loan.update({
            where: { id: activeLoan.id },
            data: { repaidAmount: { increment: amount } }
        });

        if (activeLoan.repaidAmount + amount >= activeLoan.amount) {
            await prismaTx.loan.update({ where: { id: activeLoan.id }, data: { loanStatus: 'Repaid' } });
        }
        return;
    }

    const loanId = unpaidInstallments[0].loanId;

    await prismaTx.transaction.create({
        data: {
            memberId, loanId, amount, type: 'LOAN_REPAYMENT', status: 'Completed', date: new Date(), transactionId, paymentMethod, senderNumber, reason: notes, approvedBy
        }
    });

    for (const installment of unpaidInstallments) {
        if (remainingAmount <= 0) break;
        const deficit = installment.expected - installment.paid;
        const toPay = Math.min(remainingAmount, deficit);
        
        await prismaTx.loanInstallment.update({
            where: { id: installment.id },
            data: {
                paid: { increment: toPay },
                status: (installment.paid + toPay) >= installment.expected ? 'Paid' : 'Partial'
            }
        });
        remainingAmount -= toPay;
    }

    const totalPaidInTx = amount - remainingAmount;
    if(totalPaidInTx > 0) {
        await prismaTx.loan.update({
            where: { id: loanId },
            data: { repaidAmount: { increment: totalPaidInTx } },
        });
    }
    
    if (remainingAmount > 0) {
        await prismaTx.member.update({
            where: { id: memberId },
            data: { advanceBalance: { increment: remainingAmount } }
        });
    }

    const loan = await prismaTx.loan.findUnique({ where: { id: loanId } });
    if (loan && loan.repaidAmount >= loan.amount) {
        await prismaTx.loan.update({ where: { id: loanId }, data: { loanStatus: 'Repaid' } });
    }
}
