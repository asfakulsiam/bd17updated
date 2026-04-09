

'use server';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';
import { getAdmins } from '@/services/prisma/queries/admin';
import { TransactionStatus } from '@/types';


export async function POST(req: NextRequest) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'transactions')) {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    try {
        const { id, status } = await req.json();

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: { member: true }
        });

        if (!transaction) throw new Error("Transaction not found.");
        if (transaction.status === 'Completed') return NextResponse.json({ message: "Transaction already completed." });
        
        await prisma.transaction.update({
            where: { id },
            data: { status: status, approvedBy: userId }
        });
        
        if (transaction.member.email) {
            const admins = await getAdmins();
            const approver = admins.find(a => a.id === userId);
            
            let approverName = approver ? approver.name : 'Admin';
            
            const statusTranslations: Record<TransactionStatus, string> = { 'Completed': 'সফল', 'Pending': 'অপেক্ষমান', 'Failed': 'ব্যর্থ' };
            const bnStatus = statusTranslations[status];

            await sendEmail({
                to: transaction.member.email,
                subject: `আপনার পেমেন্টের অবস্থা ${bnStatus} হয়েছে`,
                html: `
                    <h1>পেমেন্ট ${bnStatus}</h1>
                    <p>প্রিয় ${transaction.member.fullNameEn},</p>
                    <p>আপনার <strong>৳${transaction.amount.toLocaleString('bn-BD')}</strong>-এর পেমেন্ট (লেনদেন আইডি: ${transaction.transactionId}) <strong>${bnStatus}</strong> হয়েছে।</p>
                    <p><strong>যাচাই করেছেন:</strong> ${approverName}</p>
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/transactions">লেনদেনের ইতিহাস দেখুন</a>
                `
            });
        }

        if (status === 'Completed' && transaction.type === 'LOAN_REPAYMENT' && transaction.loanId) {
            const updatedLoan = await prisma.loan.findUnique({ where: { id: transaction.loanId } });
            if (updatedLoan) {
                const newRepaidAmount = updatedLoan.repaidAmount + transaction.amount;
                await prisma.loan.update({
                    where: { id: transaction.loanId },
                    data: { 
                        repaidAmount: newRepaidAmount,
                        loanStatus: newRepaidAmount >= updatedLoan.amount ? 'Repaid' : updatedLoan.loanStatus
                    }
                });
            }
        }

        revalidatePath('/admin/transactions', 'page');
        revalidatePath('/transactions', 'page');
        revalidatePath('/loan', 'page');
        revalidatePath(`/admin/members/${transaction.memberId}`, 'page');
        revalidatePath(`/account`, 'page');

        return NextResponse.json({ success: true, message: "Transaction status updated." });

    } catch (error: any) {
        console.error("Error updating transaction status:", error);
        return NextResponse.json({ error: error.message || 'Failed to update transaction status.' }, { status: 500 });
    }
}
