
import { getRecentNotices } from '@/services/prisma/queries/posts';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await getRecentNotices();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
