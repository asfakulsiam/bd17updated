
import { getLoanApplications } from '@/services/prisma/queries/loans';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await getLoanApplications();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
