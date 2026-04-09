
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { startOfMonth } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const member = await prisma.member.findUnique({ where: { clerkId: userId } });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await req.json();
    const { amount, type, paymentForMonth, shareId, notes, paymentMethod, transactionId, senderNumber } = body;
    
    if (!amount || !paymentMethod || !transactionId) {
        return NextResponse.json({ error: 'Amount, payment method, and transaction ID are required.' }, { status: 400 });
    }

    // Ensure paymentForMonth is a valid Date object or null
    let paymentForMonthDate: Date | null = null;
    if (paymentForMonth) {
        try {
            paymentForMonthDate = startOfMonth(new Date(paymentForMonth));
        } catch (e) {
            return NextResponse.json({ error: 'Invalid paymentForMonth date format.' }, { status: 400 });
        }
    }
    
    const pendingPayment = await prisma.approvedPayment.create({
        data: {
            memberId: member.id,
            amount: Number(amount),
            type: type || 'MONTHLY_SAVINGS',
            paymentForMonth: paymentForMonthDate,
            shareId,
            notes,
            paymentMethod,
            transactionId,
            senderNumber,
            status: 'Pending',
        }
    });

    revalidatePath('/admin/transactions');
    revalidatePath('/payment');
    
    return NextResponse.json({ success: true, message: 'Payment submitted for approval.', data: pendingPayment });

  } catch (err: any) {
    console.error('Manual payment submission error:', err);
    if (err.code === 'P2002' && err.meta?.target?.includes('transactionId')) {
        return NextResponse.json({ error: 'This Transaction ID has already been submitted.' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
