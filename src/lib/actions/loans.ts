
'use server';

import { revalidatePath } from 'next/cache';
import type { LoanApplicationStatus } from '@/types';
import { notifyAdmins } from '../notifications';
import { sendEmail } from '../email';
import { getAdmins } from '@/services/prisma/queries/admin';
import { getAdminRole } from '../auth';
import { uploadToCloudinary } from '../helpers';
import { auth } from '@clerk/nextjs/server';
import prisma from '../prisma';
import { addMonths, startOfMonth } from 'date-fns';

export async function applyForLoan(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error('You must be logged in to apply for a loan.');
    
    const member = await prisma.member.findUnique({
      where: { clerkId: userId },
      select: { id: true, fullNameEn: true }
    });
    if (!member) throw new Error("Member profile not found.");

    const guarantorNidFile = formData.get('guarantorNidCopy') as File;
    if (!guarantorNidFile || guarantorNidFile.size === 0) throw new Error('Guarantor NID copy is required.');
    
    const guarantorNidUpload = await uploadToCloudinary(guarantorNidFile);

    const loanData = await prisma.loan.create({
        data: {
            memberId: member.id,
            amount: Number(formData.get('loanAmount')),
            reason: formData.get('loanReason') as string,
            additionalInfo: formData.get('additionalInfo') as string,
            repaymentPeriod: Number(formData.get('repaymentPeriod')),
            applicationStatus: 'Pending',
            loanStatus: 'N_A',
            repaidAmount: 0,
            guarantor: {
                create: {
                    name: formData.get('guarantorName') as string,
                    phone: formData.get('guarantorPhone') as string,
                    address: formData.get('guarantorAddress') as string,
                    nidNumber: formData.get('guarantorNidNumber') as string,
                    nidCopyUrl: guarantorNidUpload.secure_url,
                    nidCopyPublicId: guarantorNidUpload.public_id,
                    deathPayee: formData.get('deathPayee') as string,
                    altPayeeName: formData.get('altPayeeName') as string | null,
                    altPayeeRelation: formData.get('altPayeeRelation') as string | null,
                    altPayeePhone: formData.get('altPayeePhone') as string | null,
                    altPayeeAddress: formData.get('altPayeeAddress') as string | null,
                }
            }
        },
    });

    await notifyAdmins(
        `New Loan Application - ${member.fullNameEn}`,
        `
            <h1>New Loan Application</h1>
            <p>A member has applied for a new loan.</p>
            <ul>
                <li><strong>Name:</strong> ${member.fullNameEn}</li>
                <li><strong>Amount:</strong> ৳${loanData.amount.toLocaleString()}</li>
                <li><strong>Reason:</strong> ${loanData.reason}</li>
            </ul>
            <p>Please log in to the admin dashboard to review and approve the application.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/loans">Review Loan</a>
        `,
        ['loans']
    );

    revalidatePath('/loan');
    revalidatePath('/admin/loans');
}

export async function updateLoanStatus({ loanId, status }: { loanId: string, status: LoanApplicationStatus }) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'loans')) throw new Error("Not authorized for this action.");

    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { member: true }
    });
    
    if (!loan) throw new Error("Loan not found");

    const loanStatus = status === 'Approved' ? 'Active' : 'N_A';
    const approvalDate = new Date();
    
    await prisma.$transaction(async (tx) => {
        await tx.loan.update({ 
            where: { id: loanId },
            data: { 
                applicationStatus: status,
                loanStatus: loanStatus,
                approvalDate: approvalDate,
            }
        });

        if (status === 'Approved') {
            // Create transaction for disbursement
            await tx.transaction.create({
                data: {
                    memberId: loan.memberId,
                    loanId: loan.id,
                    amount: -loan.amount, // Negative amount for disbursement
                    type: 'LOAN_DISBURSEMENT',
                    status: 'Completed',
                    date: new Date(),
                    paymentMethod: 'System',
                    transactionId: `LOAN-DIS-${loan.id.slice(0, 8).toUpperCase()}`,
                    approvedBy: userId,
                    isSystem: true,
                }
            });

            // Create future installment records
            const installmentAmount = Math.ceil(loan.amount / loan.repaymentPeriod);
            const installmentPromises = [];
            for (let i = 0; i < loan.repaymentPeriod; i++) {
                const installmentMonth = startOfMonth(addMonths(approvalDate, i + 1));
                installmentPromises.push(tx.loanInstallment.create({
                    data: {
                        loanId: loan.id,
                        month: installmentMonth,
                        expected: installmentAmount,
                        paid: 0,
                        status: 'Due'
                    }
                }));
            }
            await Promise.all(installmentPromises);
        }
    });

    
    if (loan.member.email) {
        const admins = await getAdmins();
        const approver = admins.find(a => a.id === userId);

        let approverName = 'Admin';
        if (approver) {
            approverName = approver.name;
        }
        
        await sendEmail({
            to: loan.member.email,
            subject: `Your loan application status has been updated`,
            html: `
                <h1>Loan Application ${status === 'Approved' ? 'Approved' : 'Rejected'}</h1>
                <p>Dear ${loan.member.fullNameEn},</p>
                <p>Your loan application for <strong>৳${loan.amount.toLocaleString('bn-BD')}</strong> has been <strong>${status === 'Approved' ? 'approved' : 'rejected'}</strong>.</p>
                <p><strong>Verified by:</strong> ${approverName}</p>
                ${status === 'Approved' ? '<p>The amount will be disbursed shortly. You can view the loan status in your profile.</p>' : ''}
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/loan">View Loan Status</a>
            `
        });
    }

    revalidatePath('/admin/loans');
    revalidatePath('/transactions');
    revalidatePath(`/admin/members/${loan.memberId}`);
    revalidatePath('/loan');
}

export async function markLoanAsRepaid(loanId: string) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'loans') throw new Error("Not authorized for this action.");

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new Error("Loan not found.");
    
    if (loan.repaidAmount < loan.amount) {
        throw new Error("Loan cannot be marked as repaid. The full amount has not been repaid yet.")
    }

    await prisma.loan.update({ where: { id: loanId }, data: { loanStatus: 'Repaid' }});
    
    revalidatePath('/admin/loans');
    revalidatePath('/loan');
    revalidatePath(`/admin/members/${loan.memberId}`);
}
