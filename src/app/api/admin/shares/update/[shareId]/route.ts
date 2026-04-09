
import prisma from '@/lib/prisma';
import { getAdminRole } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest, { params }: { params: Promise<{ shareId: string }> }) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const { shareId } = await params;

    try {
        const formData = await req.formData();
        const data = {
            sharerName: formData.get('sharerName') as string,
            sharerNid: formData.get('sharerNid') as string,
            sharerPhone: formData.get('sharerPhone') as string,
            sharerAddress: formData.get('sharerAddress') as string,
        };
        
        const updatedShare = await prisma.share.update({
            where: { id: shareId },
            data,
            select: { memberId: true }
        });

        revalidatePath(`/admin/members/${updatedShare.memberId}`);
        return NextResponse.json({ success: true, message: 'Share updated.', memberId: updatedShare.memberId });
    } catch (error: any) {
        console.error("Error updating share:", error);
        return NextResponse.json({ error: error.message || 'Failed to update share.' }, { status: 500 });
    }
}
