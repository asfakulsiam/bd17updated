
import { getAdminRole } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ shareId: string }> }) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const { shareId } = await params;

    try {
        const share = await prisma.share.findFirst({
            where: { id: shareId },
            select: { id: true, memberId: true }
        });
        
        if (!share) {
            return NextResponse.json({ error: "Share not found." }, { status: 404 });
        }

        // Instead of deleting, we update the status to 'Removed'.
        // This preserves the history for financial calculations.
        await prisma.share.update({ 
            where: { id: shareId },
            data: { status: 'Removed' }
        });

        revalidatePath(`/admin/members/${share.memberId}`);
        revalidatePath('/account');
        return NextResponse.json({ success: true, message: 'Share marked as removed successfully.', memberId: share.memberId });
    } catch (error: any) {
        console.error("Error 'deleting' share:", error);
        return NextResponse.json({ error: error.message || 'Failed to remove share.' }, { status: 500 });
    }
}
