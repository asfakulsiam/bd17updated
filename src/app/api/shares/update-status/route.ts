
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { updateShareStatus as updateShareStatusAction, convertShareToAdvance } from '@/lib/actions/shares';
import { ShareStatus } from '@/types';

export async function POST(req: NextRequest) {
    try {
        const { shareId, status } = await req.json();
        let result;

        if (status === 'Removed') {
            result = await convertShareToAdvance(shareId);
        } else {
            result = await updateShareStatusAction({ shareId, status });
        }
        
        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("Error in share status update route:", error);
        return NextResponse.json({ error: error.message || 'Failed to update share status.' }, { status: 500 });
    }
}
