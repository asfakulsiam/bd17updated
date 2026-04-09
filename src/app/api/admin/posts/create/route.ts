

import { NextRequest, NextResponse } from 'next/server';
import { createPost as createPostAction } from '@/lib/actions/posts';
import { PostStatus } from '@/types';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const status = formData.get('status') as PostStatus;

        await createPostAction(formData, status);

        return NextResponse.json({ message: "Post created successfully" });
    } catch(error: any) {
        console.error("Error creating post from API route:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
