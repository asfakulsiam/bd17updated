
'use server';

import { revalidatePath } from 'next/cache';
import type { TransactionType } from '@/types';
import { getAdminRole } from '../auth';
import { getAdmins } from '@/services/prisma/queries/admin';
import { sendEmail } from '../email';
import { auth } from '@clerk/nextjs/server';
import prisma from '../prisma';
import { getAllTransactions as getAllTransactionsQuery } from '@/services/prisma/queries/transactions';
import { allocateLoanRepayment, allocateSavingsPayment, calculateFinancials } from '../financials.server';


export async function getAllTransactionsAction() {
    const role = await getAdminRole();
    if (!role || (role !== 'super' && role !== 'transactions')) {
        return [];
    }
    return getAllTransactionsQuery();
}

export async function approvePayment(approvedPaymentId: string) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'transactions')) throw new Error("Not authorized for this action.");

    const payment = await prisma.approvedPayment.findUnique({
        where: { id: approvedPaymentId, status: 'Pending' },
        include: { member: true }
    });

    if (!payment) {
        throw new Error('Payment not found or already processed.');
    }
    
    if (payment.transactionId) {
        const existingTransaction = await prisma.transaction.findFirst({
            where: { transactionId: payment.transactionId }
        });
        if (existingTransaction) {
             await prisma.approvedPayment.update({
                where: { id: approvedPaymentId },
                data: { status: 'Rejected', notes: 'Duplicate Transaction ID found.' }
            });
            throw new Error(`This Transaction ID (${payment.transactionId}) has already been processed.`);
        }
    }


    try {
        await prisma.$transaction(async (tx) => {
            if (payment.type === 'MONTHLY_SAVINGS') {
                await allocateSavingsPayment({
                    prismaTx: tx,
                    memberId: payment.memberId,
                    amount: payment.amount,
                    transactionId: payment.transactionId,
                    paymentMethod: payment.paymentMethod || 'Manual',
                    senderNumber: payment.senderNumber,
                    notes: payment.notes,
                    approvedBy: userId,
                    paymentForMonth: payment.paymentForMonth ? { month: payment.paymentForMonth.toISOString().substring(0, 7), shareId: payment.shareId || null } : null,
                });
            } else if (payment.type === 'LOAN_REPAYMENT') {
                await allocateLoanRepayment({
                    prismaTx: tx,
                    memberId: payment.memberId,
                    amount: payment.amount,
                    transactionId: payment.transactionId,
                    paymentMethod: payment.paymentMethod || 'Manual',
                    senderNumber: payment.senderNumber,
                    notes: payment.notes,
                    approvedBy: userId,
                });
            } else if (payment.type === 'SPECIAL_SAVINGS') {
                // SPECIAL SAVINGS: Bypass allocation engine, deposit directly
                await tx.transaction.create({
                    data: {
                        memberId: payment.memberId,
                        amount: payment.amount,
                        type: 'SPECIAL_SAVINGS',
                        status: 'Completed',
                        date: new Date(),
                        transactionId: payment.transactionId,
                        paymentMethod: payment.paymentMethod || 'Manual',
                        senderNumber: payment.senderNumber || undefined,
                        reason: payment.notes || 'Special Savings',
                        approvedBy: userId
                    }
                });
            } else { // OTHER
                const txData: any = {
                    memberId: payment.memberId,
                    amount: payment.amount,
                    type: payment.type as TransactionType,
                    status: 'Completed',
                    date: new Date(),
                    transactionId: payment.transactionId,
                    paymentMethod: payment.paymentMethod || 'Manual',
                    senderNumber: payment.senderNumber || undefined,
                    reason: payment.notes || undefined,
                    approvedBy: userId
                };
                if (payment.eventId) {
                    txData.eventId = payment.eventId;
                }
                const txRecord = await tx.transaction.create({ data: txData });

                if (payment.eventId) {
                    await tx.eventPayment.create({
                        data: {
                            memberId: payment.memberId,
                            eventId: payment.eventId,
                            transactionId: txRecord.id,
                        }
                    });
                }
            }

            await tx.approvedPayment.update({
                where: { id: approvedPaymentId },
                data: { status: 'Approved', approvedBy: userId, approvedAt: new Date() }
            });

            await calculateFinancials(payment.memberId, tx);

        }, { timeout: 60000, maxWait: 60000 });

        if (payment.member.email) {
            try {
                const admins = await getAdmins();
                const approver = admins.find(a => a.id === userId);
                await sendEmail({
                    to: payment.member.email,
                    subject: `আপনার পেমেন্ট অনুমোদিত হয়েছে`,
                    html: `
                        <h1>পেমেন্ট অনুমোদিত</h1>
                        <p>প্রিয় ${payment.member.fullNameEn},</p>
                        <p>আপনার <strong>৳${payment.amount.toLocaleString()}</strong>-এর পেমেন্ট সফলভাবে অনুমোদিত হয়েছে।</p>
                        <p><strong>যাচাই করেছেন:</strong> ${approver?.name || 'Admin'}</p>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/transactions">লেনদেনের ইতিহাস দেখুন</a>
                    `
                });
            } catch (emailError) {
                console.warn(`Email notification failed for payment ${payment.id}:`, emailError);
            }
        }
        
        revalidatePath('/admin/transactions');
        revalidatePath('/transactions');
        revalidatePath(`/admin/members/${payment.memberId}`);
        revalidatePath('/loan');
        revalidatePath('/account');
        revalidatePath('/payment');
        revalidatePath('/admin/paid-status');
        revalidatePath('/admin/dashboard');

    } catch (error) {
        console.error('Error approving payment:', error);
        throw new Error('Failed to approve payment.');
    }
}


export async function rejectPayment(approvedPaymentId: string) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'transactions')) throw new Error("Not authorized for this action.");

     try {
        const payment = await prisma.approvedPayment.findUnique({
            where: { id: approvedPaymentId, status: 'Pending' },
        });

        if (!payment) {
            throw new Error('Payment not found or already processed.');
        }

        await prisma.approvedPayment.update({
            where: { id: approvedPaymentId },
            data: { status: 'Rejected', approvedBy: userId, approvedAt: new Date() }
        });


        const member = await prisma.member.findUnique({ where: { id: payment.memberId } });
        if (member?.email) {
             const admins = await getAdmins();
            const approver = admins.find(a => a.id === userId);
            
            await sendEmail({
                to: member.email,
                subject: `আপনার পেমেন্ট বাতিল করা হয়েছে`,
                html: `
                    <h1>পেমেন্ট বাতিল</h1>
                    <p>প্রিয় ${member.fullNameEn},</p>
                    <p>আপনার <strong>৳${payment.amount.toLocaleString()}</strong>-এর পেমেন্টটি পর্যালোচনার পর বাতিল করা হয়েছে।</p>
                    <p>অনুগ্রহ করে তথ্য যাচাই করে পুনরায় সাবমিট করুন।</p>
                    <p><strong>বাতিল করেছেন:</strong> ${approver?.name || 'Admin'}</p>
                `
            });
        }
        revalidatePath('/admin/transactions');
        revalidatePath('/transactions');
    } catch (error) {
        console.error('Error rejecting payment:', error);
        throw new Error('Failed to reject payment.');
    }
}

export async function makePaymentForMember(memberId: string, formData: FormData) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'transactions')) {
        throw new Error("Unauthorized");
    }

    await prisma.$transaction(async (tx) => {
        const type = formData.get('type') as TransactionType;
        const amount = Number(formData.get('amount-display'));
        const reason = formData.get('reason') as string | undefined;
        const transactionId = formData.get('transactionId') as string;
        const paymentMethod = formData.get('service') as string;
        const senderNumber = formData.get('senderNumber') as string | undefined;
        const paymentForMonthString = formData.get('paymentForMonth') as string | null;
        
        const paymentForMonth = paymentForMonthString ? { month: paymentForMonthString, shareId: null } : null;

        if (type === 'MONTHLY_SAVINGS') {
            await allocateSavingsPayment({
                prismaTx: tx, memberId, amount, transactionId, paymentMethod, senderNumber, notes: reason, approvedBy: userId, paymentForMonth
            });
        } else if (type === 'LOAN_REPAYMENT') {
             await allocateLoanRepayment({
                prismaTx: tx, memberId, amount, transactionId, paymentMethod, senderNumber, notes: reason, approvedBy: userId,
            });
        } else if (type === 'SPECIAL_SAVINGS') {
            await tx.transaction.create({
                data: {
                    memberId,
                    amount,
                    type: 'SPECIAL_SAVINGS',
                    status: 'Completed',
                    date: new Date(),
                    transactionId,
                    paymentMethod,
                    senderNumber,
                    reason: reason || 'Special Savings',
                    approvedBy: userId,
                    isSystem: true
                }
            });
        } else { // OTHER or EVENT
            const eventId = formData.get('eventId') as string | undefined;
            const txRecord = await tx.transaction.create({
                data: {
                    memberId, amount, type, status: 'Completed', date: new Date(), transactionId, paymentMethod, senderNumber, reason, approvedBy: userId, isSystem: true,
                    ...(eventId && { eventId }),
                }
            });
    
            if (eventId) {
                await tx.eventPayment.create({
                    data: {
                        memberId,
                        eventId,
                        transactionId: txRecord.id,
                    }
                });
            }
        }

        await calculateFinancials(memberId, tx);
        
    }, { timeout: 60000, maxWait: 60000 });

    revalidatePath(`/admin/members/${memberId}`);
    revalidatePath('/transactions');
    revalidatePath('/payment');
}
