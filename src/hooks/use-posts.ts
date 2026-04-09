'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PostStatus, Post } from '@/types';
import { toast } from './use-toast';
import { getPosts, getPostById } from '@/services/prisma/queries/posts';
import { createPost as createPostAction, updatePost as updatePostAction } from '@/lib/actions/posts';

async function fetchRecentNotices(): Promise<Post[]> {
    const response = await fetch('/api/posts/recent-notices');
    if (!response.ok) {
        throw new Error('Failed to fetch recent notices');
    }
    return response.json();
}

async function fetchDashboardPosts(): Promise<Post[]> {
    const response = await fetch('/api/posts/dashboard');
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard posts');
    }
    return response.json();
}

export const usePosts = (status?: PostStatus) => {
    return useQuery({
        queryKey: ['posts', status],
        queryFn: () => getPosts(status),
    });
};

export const usePostById = (id: string) => {
    return useQuery({
        queryKey: ['post', id],
        queryFn: () => getPostById(id),
        enabled: !!id,
    });
};

export const useRecentNotices = () => {
    return useQuery({
        queryKey: ['recentNotices'],
        queryFn: fetchRecentNotices,
    });
};

export const useDashboardPosts = () => {
    return useQuery({
        queryKey: ['dashboardPosts'],
        queryFn: fetchDashboardPosts,
    });
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ formData, status }: { formData: FormData, status: PostStatus }) => {
            return createPostAction(formData, status);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['recentNotices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardPosts'] });
            toast({
                title: variables.status === 'Published' ? "Post Published" : "Draft Saved",
                description: "Your post has been successfully saved.",
            });
        },
        onError: (error: Error) => {
            toast({ title: "Error creating post", description: error.message, variant: "destructive" });
        }
    });
};

export const useUpdatePost = (postId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ formData, status }: { formData: FormData, status: PostStatus }) => {
            return updatePostAction(postId, formData, status);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            queryClient.invalidateQueries({ queryKey: ['recentNotices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardPosts'] });
            toast({
                title: variables.status === 'Published' ? "Post Updated" : "Draft Updated",
                description: "The post has been updated.",
            });
        },
        onError: (error: Error) => {
            toast({ title: "Error updating post", description: error.message, variant: "destructive" });
        }
    });
};

export const useDeletePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await fetch(`/api/posts/delete/${postId}`, {
                method: 'DELETE',
            });
             if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['recentNotices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardPosts'] });
            toast({ title: "Post Deleted" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};
