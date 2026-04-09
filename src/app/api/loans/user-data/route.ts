
import { getUserLoanData } from '@/services/prisma/queries/loans';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await getUserLoanData();
        if (!data) {
            return NextResponse.json({ error: 'Could not retrieve user loan data. The user may not be logged in or does not exist.' }, { status: 404 });
        }
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
