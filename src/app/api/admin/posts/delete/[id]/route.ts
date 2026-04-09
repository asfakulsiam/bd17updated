
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { deletePost as deletePostAction } from '@/lib/actions/posts';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        await deletePostAction(postId);

        return NextResponse.json({ message: "Post deleted successfully" });
    } catch(error: any) {
        console.error("Error deleting post from API route:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
