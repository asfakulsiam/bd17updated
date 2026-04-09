

import prisma from '@/lib/prisma';
import { getAdminRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/helpers';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getUserLoanData } from '@/services/prisma/queries/loans';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
    const { userId } = await auth();
    const role = await getAdminRole();
    const { memberId } = await params;

    if (!userId || (role !== 'super' && role !== 'loans')) {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    try {
        const formData = await req.formData();
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) {
            return NextResponse.json({ error: "Member not found." }, { status: 404 });
        }

        const activeLoan = await prisma.loan.findFirst({ where: { memberId, loanStatus: 'Active' }});
        if (activeLoan) {
            return NextResponse.json({ error: "Member already has an active loan." }, { status: 400 });
        }
        
        const loanableData = await getUserLoanData(member.clerkId);
        if (!loanableData) {
            return NextResponse.json({ error: "Could not calculate loanable amount for member." }, { status: 500 });
        }

        const maxLoanableAmount = loanableData.maxLoanableAmount;
        const requestedAmount = Number(formData.get('loanAmount'));

        if (requestedAmount > maxLoanableAmount) {
            return NextResponse.json({ error: `Cannot assign loan. Requested amount exceeds available funds for this member (৳${maxLoanableAmount.toLocaleString()}).` }, { status: 400 });
        }

        const guarantorNidFile = formData.get('guarantorNidCopy') as File;
        if (!guarantorNidFile || guarantorNidFile.size === 0) {
            return NextResponse.json({ error: 'Guarantor NID copy is required.' }, { status: 400 });
        }
        const guarantorNidUpload = await uploadToCloudinary(guarantorNidFile);

        const newLoan = await prisma.loan.create({
            data: {
                memberId,
                amount: requestedAmount,
                repaymentPeriod: Number(formData.get('repaymentPeriod')),
                reason: formData.get('loanReason') as string,
                applicationStatus: 'Approved',
                loanStatus: 'Active',
                approvalDate: new Date(),
                applicationDate: new Date(),
                guarantor: {
                    create: {
                        name: formData.get('guarantorName') as string,
                        phone: formData.get('guarantorPhone') as string,
                        address: formData.get('guarantorAddress') as string,
                        nidNumber: formData.get('guarantorNidNumber') as string,
                        nidCopyUrl: guarantorNidUpload.secure_url,
                        nidCopyPublicId: guarantorNidUpload.public_id,
                        deathPayee: formData.get('deathPayee') as string,
                    }
                }
            }
        });

        await prisma.transaction.create({
            data: {
                memberId,
                loanId: newLoan.id,
                amount: -requestedAmount, // Negative amount for disbursement
                type: 'LOAN_DISBURSEMENT',
                status: 'Completed',
                date: new Date(),
                paymentMethod: 'System',
                transactionId: `LOAN-DIS-${Date.now()}`,
                approvedBy: userId,
                isSystem: true
            }
        });


        revalidatePath(`/admin/members/${memberId}`);
        revalidatePath(`/loan`);
        return NextResponse.json({ success: true, message: "Loan assigned successfully." });
    } catch (error: any) {
        console.error("Error assigning manual loan:", error);
        return NextResponse.json({ error: error.message || "Failed to assign loan." }, { status: 500 });
    }
}
