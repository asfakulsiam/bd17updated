
import prisma from "@/lib/prisma";
import { getAdminRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    const role = await getAdminRole();
    if (role !== 'super') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const formData = await req.formData();
    
    const data = await prisma.event.create({
        data: {
            name: formData.get('name') as string,
            description: formData.get('description') as string | null,
            amount: Number(formData.get('amount')),
            startDate: new Date(formData.get('startDate') as string),
            endDate: new Date(formData.get('endDate') as string),
        }
    });

    revalidatePath('/admin/settings');
    revalidatePath('/payment');
    
    return NextResponse.json({ message: "Event created successfully." });
}
