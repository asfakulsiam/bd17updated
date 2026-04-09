

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { updatePost as updatePostAction } from '@/lib/actions/posts';
import { PostStatus } from '@/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const formData = await req.formData();
        const status = formData.get('status') as PostStatus;

        await updatePostAction(postId, formData, status);

        return NextResponse.json({ message: "Post updated successfully" });
    } catch (error: any) {
        console.error("Error updating post from API route:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
