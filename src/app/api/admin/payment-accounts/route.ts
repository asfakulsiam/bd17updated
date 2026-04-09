
import prisma from "@/lib/prisma";
import { getAdminRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { PaymentAccountType } from "@/models";

async function verifyAdmin() {
    const role = await getAdminRole();
    if (role !== 'super') {
        throw new Error("Not authorized for this action.");
    }
}

export async function POST(req: NextRequest) {
    try {
        await verifyAdmin();
        const formData = await req.formData();
        const accountType = formData.get('accountType') as PaymentAccountType;
        const data: any = {
            accountType,
            accountNumber: formData.get('accountNumber') as string,
            notice: formData.get('notice') as string,
            accountName: formData.get('accountName') as string,
            bankName: null,
        };

        if (accountType === 'Bank') {
            data.bankName = formData.get('bankName') as string;
        }

        const newAccount = await prisma.paymentAccount.create({ data });

        revalidatePath('/admin/settings');
        revalidatePath('/payment');
        return NextResponse.json(newAccount);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await verifyAdmin();
        const formData = await req.formData();
        const id = formData.get('id') as string;
        const accountType = formData.get('accountType') as PaymentAccountType;
        const data: any = {
            accountType,
            accountNumber: formData.get('accountNumber') as string,
            notice: formData.get('notice') as string,
            accountName: formData.get('accountName') as string,
            bankName: null,
        };
         if (accountType === 'Bank') {
            data.bankName = formData.get('bankName') as string | null;
        }
        
        const updatedAccount = await prisma.paymentAccount.update({ where: {id}, data});

        revalidatePath('/admin/settings');
        revalidatePath('/payment');
        return NextResponse.json(updatedAccount);
    } catch (error: any) {
         return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await verifyAdmin();
        const { id } = await req.json();

        await prisma.paymentAccount.delete({ where: {id} });

        revalidatePath('/admin/settings');
        revalidatePath('/payment');
        return NextResponse.json({ message: 'Account deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
