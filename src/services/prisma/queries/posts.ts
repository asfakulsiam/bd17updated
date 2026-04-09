

'use server';

import prisma from '@/lib/prisma';
import type { Post, PostStatus } from '@/types';
import { serializePost } from '@/lib/serializers';


export async function getRecentNotices(): Promise<Post[]> {
    const data = await prisma.post.findMany({
        where: { status: 'Published', type: 'NOTICE' },
        orderBy: { createdAt: 'desc' },
        take: 3
    });

    return data.map(serializePost);
}

export async function getDashboardPosts(): Promise<Post[]> {
    const data = await prisma.post.findMany({
        where: { status: 'Published', type: 'DASHBOARD_POST' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    return data.map(serializePost);
}

export async function getPosts(status?: PostStatus): Promise<Post[]> {
    let query: any = {
        orderBy: { createdAt: 'desc' }
    };
    if (status) {
        query.where = { status: status };
    }
    const data = await prisma.post.findMany(query);
    return data.map(serializePost);
}

export async function getPostById(id: string): Promise<Post | null> {
    const data = await prisma.post.findUnique({ where: { id }});
    if (!data) return null;
    return serializePost(data);
}
