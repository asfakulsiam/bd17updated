
'use server';

import prisma from '@/lib/prisma';
import type { TransactionType } from '@/models';
import { notifyAdmins } from '@/lib/notifications';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { startOfMonth } from 'date-fns';

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }
    
    try {
        const body = await req.json();
        const {
            amount,
            type,
            paymentForMonth,
            paymentMethod,
            transactionId,
            senderNumber,
            service,
            reason,
            shareId,
        } = body;
        
        const member = await prisma.member.findUnique({ where: { clerkId: userId }});
        if (!member) {
            return NextResponse.json({ error: "Member profile not found." }, { status: 404 });
        }

        if (!amount || !paymentMethod || !transactionId) {
            return NextResponse.json({ error: 'Amount, payment method, and transaction ID are required.' }, { status: 400 });
        }

        // Pre-emptive check for duplicate transaction ID
        const existingPayment = await prisma.approvedPayment.findFirst({
            where: { transactionId: transactionId, status: { not: 'Rejected' } }
        });
        if(existingPayment) {
            return NextResponse.json({ error: 'This Transaction ID has already been submitted.' }, { status: 409 });
        }


        let transactionType: TransactionType = type;
        let eventId: string | undefined;

        if (type.startsWith('EVENT_')) {
            transactionType = 'OTHER'; // Event payments are a type of "Other"
            eventId = type.split('_')[1];
        }

        let paymentForMonthDate: Date | null = null;
        if(paymentForMonth) {
            try {
                paymentForMonthDate = startOfMonth(new Date(paymentForMonth));
            } catch (e) {
                 return NextResponse.json({ error: 'Invalid paymentForMonth date format.' }, { status: 400 });
            }
        }

        const dataToCreate: any = {
            memberId: member.id,
            amount: Number(amount),
            type: transactionType,
            shareId,
            paymentForMonth: paymentForMonthDate,
            notes: reason,
            paymentMethod: service,
            transactionId,
            senderNumber,
            status: 'Pending',
        };

        if (eventId) {
            dataToCreate.eventId = eventId;
        }

        const newPayment = await prisma.approvedPayment.create({
            data: dataToCreate,
        });
        
        revalidatePath('/payment');
        revalidatePath('/transactions');
        revalidatePath('/admin/transactions');
        revalidatePath('/admin/dashboard');

        await notifyAdmins(
            `New Manual Payment - ${member.fullNameEn}`,
            `
                <h1>Manual Payment for Review</h1>
                <p>A member has submitted a manual payment for verification.</p>
                <ul>
                    <li><strong>Name:</strong> ${member.fullNameEn}</li>
                    <li><strong>Amount:</strong> ৳${Number(amount).toLocaleString('bn-BD')}</li>
                    <li><strong>Type:</strong> ${transactionType.replace('_', ' ')}</li>
                    ${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
                </ul>
                <p>Please log in to the admin dashboard to review and approve the transaction.</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/transactions?tab=pending">Review Transaction</a>
            `,
            ['transactions']
        );

        return NextResponse.json({ success: true, message: 'Payment submitted for review.', data: newPayment });

    } catch (error: any) {
        console.error("Error submitting manual payment:", error);
         if (error.code === 'P2002' && error.meta?.target?.includes('transactionId')) {
            return NextResponse.json({ error: 'This Transaction ID has already been submitted.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Failed to submit payment.' }, { status: 500 });
    }
}
