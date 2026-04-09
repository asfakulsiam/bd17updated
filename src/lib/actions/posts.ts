

'use server';

import { revalidatePath } from 'next/cache';
import { PostStatus, PostType } from '@/types';
import { getAdminRole } from '../auth';
import { uploadToCloudinary, deleteFromCloudinary } from '../helpers';
import prisma from '../prisma';
import { auth } from '@clerk/nextjs/server';

export async function createPost(formData: FormData, status: PostStatus) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'posts')) throw new Error("Not authorized for this action.");

    const newImages = formData.getAll('newImages') as File[];
    const uploadResults = await Promise.all(newImages.filter(img => img.size > 0).map(img => uploadToCloudinary(img)));
    
    const newImageUrls = uploadResults.map(r => r.secure_url);
    const newImagePublicIds = uploadResults.map(r => r.public_id);

    await prisma.post.create({
        data: {
            title: formData.get('title') as string,
            content: formData.get('content') as string,
            type: formData.get('type') as PostType,
            status: status,
            authorId: userId,
            imageUrls: newImageUrls,
            imagePublicIds: newImagePublicIds,
        }
    });

    revalidatePath('/admin/posts');
    revalidatePath('/notices');
    revalidatePath('/', 'layout');
}

export async function updatePost(postId: string, formData: FormData, status: PostStatus) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'posts')) throw new Error("Not authorized for this action.");

    const post = await prisma.post.findUnique({ where: { id: postId }});
    if (!post) throw new Error("Post not found");

    const newImages = formData.getAll('newImages') as File[];
    const uploadResults = await Promise.all(newImages.filter(img => img.size > 0).map(img => uploadToCloudinary(img)));
    const newImageUrls = uploadResults.map(r => r.secure_url);
    const newImagePublicIds = uploadResults.map(r => r.public_id);

    const existingImageUrlsFromForm = formData.getAll('existingImageUrls').map(String).filter(Boolean);
    
    const originalImageUrls = Array.isArray(post.imageUrls) ? post.imageUrls : [];
    const originalPublicIds = Array.isArray(post.imagePublicIds) ? post.imagePublicIds : [];

    const urlsToKeep = new Set(existingImageUrlsFromForm);
    const publicIdsToDelete: string[] = [];
    const publicIdsToKeep: string[] = [];
    const urlsToKeepFinal: string[] = [];

    originalImageUrls.forEach((url, index) => {
        if (urlsToKeep.has(url)) {
            urlsToKeepFinal.push(url);
            if(originalPublicIds[index]) {
                publicIdsToKeep.push(originalPublicIds[index]);
            }
        } else {
            if(originalPublicIds[index]) {
                publicIdsToDelete.push(originalPublicIds[index]);
            }
        }
    });

    if (publicIdsToDelete.length > 0) {
        await Promise.all(publicIdsToDelete.map(id => deleteFromCloudinary(id)));
    }

    const finalImageUrls = [...urlsToKeepFinal, ...newImageUrls];
    const finalPublicIds = [...publicIdsToKeep, ...newImagePublicIds];

    await prisma.post.update({
        where: { id: postId },
        data: {
            title: formData.get('title') as string,
            content: formData.get('content') as string,
            type: formData.get('type') as PostType,
            status: status,
            imageUrls: finalImageUrls,
            imagePublicIds: finalPublicIds
        }
    });

    
    revalidatePath('/admin/posts');
    revalidatePath(`/admin/posts/edit/${postId}`);
    revalidatePath('/notices');
    revalidatePath(`/notices/${postId}`);
    revalidatePath('/', 'layout');
}

export async function deletePost(postId: string) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'posts') throw new Error("Not authorized for this action.");
    
    const post = await prisma.post.findUnique({ where: { id: postId }});
    if (post && post.imagePublicIds && Array.isArray(post.imagePublicIds)) {
        await Promise.all(post.imagePublicIds.map(id => deleteFromCloudinary(id)));
    }

    await prisma.post.delete({ where: { id: postId }});
    
    revalidatePath('/admin/posts');
    revalidatePath('/notices');
    revalidatePath('/');
}
