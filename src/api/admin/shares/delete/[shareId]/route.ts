
'use server';

import { getAdminRole } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { convertShareToAdvance } from '@/lib/actions/shares';

export async function DELETE(req: NextRequest, { params }: { params: { shareId: string } }) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const { shareId } = params;

    try {
        const result = await convertShareToAdvance(shareId);
        return NextResponse.json({ success: true, message: 'Share converted to advance successfully.', data: result });
    } catch (error: any) {
        console.error("Error converting share to advance via API:", error);
        return NextResponse.json({ error: error.message || 'Failed to convert share.' }, { status: 500 });
    }
}
