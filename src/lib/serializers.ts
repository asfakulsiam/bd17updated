

import type { Post, Loan, Settings, Event, Transaction, Member, Share, Guarantor, MonthlyPayment, LoanInstallment } from '@/types';

function safeToISOString(date: any): string | null {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString();
        }
    }
    return null;
}

export const serializePost = (post: any): Post => {
    let imageUrls: string[] = [];
    if (typeof post.imageUrls === 'string' && post.imageUrls.length > 0) {
        // Handle incorrect comma-separated string data from the database
        imageUrls = post.imageUrls.split(',').filter((url:string) => url.trim() !== '');
    } else if (Array.isArray(post.imageUrls)) {
        // Handle correctly formatted array data
        imageUrls = post.imageUrls;
    }

    return {
        ...post,
        createdAt: safeToISOString(post.createdAt)!,
        updatedAt: safeToISOString(post.updatedAt)!,
        imageUrls: imageUrls,
    };
};


export const serializeLoan = (loan: any): Loan => ({
    ...loan,
    applicationDate: safeToISOString(loan.applicationDate)!,
    approvalDate: safeToISOString(loan.approvalDate),
    createdAt: safeToISOString(loan.createdAt)!,
    updatedAt: safeToISOString(loan.updatedAt)!,
    guarantor: loan.guarantor ? serializeGuarantor(loan.guarantor) : null,
    installments: loan.installments ? loan.installments.map(serializeLoanInstallment) : [],
});

export const serializeGuarantor = (guarantor: any): Guarantor => ({
    ...guarantor,
    createdAt: safeToISOString(guarantor.createdAt)!,
    updatedAt: safeToISOString(guarantor.updatedAt)!,
});

export const serializeLoanInstallment = (installment: any): LoanInstallment => ({
    ...installment,
    month: installment.month,
});


export const serializeSettings = (settings: any): Settings => ({
    ...settings,
    createdAt: safeToISOString(settings.createdAt)!,
    updatedAt: safeToISOString(settings.updatedAt)!,
});

export const serializeEvent = (event: any): Event => ({
    ...event,
    startDate: safeToISOString(event.startDate)!,
    endDate: safeToISOString(event.endDate)!,
    createdAt: safeToISOString(event.createdAt)!,
    updatedAt: safeToISOString(event.updatedAt)!,
});

export const serializeTransaction = (transaction: any): Transaction => ({
    ...transaction,
    date: safeToISOString(transaction.date)!,
    createdAt: safeToISOString(transaction.createdAt)!,
    updatedAt: safeToISOString(transaction.updatedAt)!,
});

export const serializeShare = (share: any): Share => ({
    ...share,
    createdAt: safeToISOString(share.createdAt)!,
    updatedAt: safeToISOString(share.updatedAt)!,
    joiningDate: safeToISOString(share.joiningDate)!,
    monthlyPayments: share.monthlyPayments ? share.monthlyPayments.map(serializeMonthlyPayment) : [],
});

export const serializeMonthlyPayment = (payment: any): MonthlyPayment => ({
    ...payment,
    month: payment.month,
});

export const serializeMember = (member: any): Member => ({
    ...member,
    dob: safeToISOString(member.dob),
    joiningDate: safeToISOString(member.joiningDate),
    createdAt: safeToISOString(member.createdAt)!,
    updatedAt: safeToISOString(member.updatedAt)!,
    shares: member.shares ? member.shares.map(serializeShare) : [],
});
