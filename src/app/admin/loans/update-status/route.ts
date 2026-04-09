
import prisma from '@/lib/prisma';
import { getAdminRole } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';
import { getAdmins } from '@/services/prisma/queries/admin';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'loans') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const { userId } = await auth();
    if (!userId) {
         return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
    }

    try {
        const { loanId, status } = await req.json();
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { member: true }
        });
        
        if (!loan) {
            return NextResponse.json({ error: "Loan not found" }, { status: 404 });
        }

        const loanStatus = status === 'Approved' ? 'Active' : 'N_A';
        
        await prisma.loan.update({ 
            where: { id: loanId },
            data: { 
                applicationStatus: status,
                loanStatus: loanStatus,
                approvalDate: status === 'Approved' ? new Date() : null,
            }
        });

        if (status === 'Approved') {
            await prisma.transaction.create({
                data: {
                    memberId: loan.memberId,
                    loanId: loan.id,
                    amount: -loan.amount,
                    type: 'LOAN_DISBURSEMENT',
                    status: 'Completed',
                    paymentMethod: 'Manual',
                    transactionId: `LOAN-DIS-${loan.id.slice(0, 8).toUpperCase()}`,
                    approvedBy: userId
                }
            });
        }
        
        if (loan.member.email) {
            const admins = await getAdmins();
            const approver = admins.find(a => a.id === userId);
            let approverName = approver ? `${approver.name}` : 'Admin';
            
            await sendEmail({
                to: loan.member.email,
                subject: `আপনার ঋণের আবেদনের অবস্থা আপডেট করা হয়েছে`,
                html: `
                    <h1>ঋণের আবেদন ${status === 'Approved' ? 'অনুমোদিত' : 'বাতিল'}</h1>
                    <p>প্রিয় ${loan.member.fullNameEn},</p>
                    <p>আপনার <strong>৳${loan.amount.toLocaleString('bn-BD')}</strong>-এর ঋণের আবেদনটি <strong>${status === 'Approved' ? 'অনুমোদিত' : 'বাতিল'}</strong> করা হয়েছে।</p>
                    <p><strong>যাচাই করেছেন:</strong> ${approverName}</p>
                    ${status === 'Approved' ? '<p>টাকা শীঘ্রই আপনাকে হস্তান্তর করা হবে। আপনি আপনার প্রোফাইলে ঋণের অবস্থা দেখতে পারেন।</p>' : ''}
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/loan">ঋণের অবস্থা দেখুন</a>
                `
            });
        }

        revalidatePath('/admin/loans', 'page');
        revalidatePath('/transactions');
        return NextResponse.json({ success: true, message: `Loan status updated to ${status}` });
    } catch (error: any) {
        console.error("Error updating loan status:", error);
        return NextResponse.json({ error: error.message || "Failed to update loan status." }, { status: 500 });
    }
}
