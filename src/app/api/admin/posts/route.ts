
import { getPosts } from '@/services/prisma/queries/posts';
import { NextRequest, NextResponse } from 'next/server';
import { PostStatus } from '@/types';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as PostStatus | undefined;

    try {
        const data = await getPosts(status);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
