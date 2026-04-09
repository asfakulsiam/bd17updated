
'use client';

import { useState, useEffect, useTransition, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Send, Trash2, UploadCloud, Loader2, Newspaper, Image as ImageIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Post, PostStatus } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getPostById } from '@/services/prisma/queries/posts';
import { useUpdatePost } from '@/hooks/use-posts';
import { getValidImageSrc } from '@/lib/utils';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [post, setPost] = useState<Post | null>(null);
    const router = useRouter();
    const updatePostMutation = useUpdatePost(id);
    const { toast } = useToast();

    useEffect(() => {
        async function loadPost() {
            const postToEdit = await getPostById(id);
            if (postToEdit) {
                setPost(postToEdit);
            } else {
                toast({ title: "Error", description: "Post not found.", variant: "destructive" });
                router.push('/admin/posts');
            }
        }
        loadPost();
    }, [id, router, toast]);

    const handleSubmit = async (status: PostStatus) => {
        if (!post?.title) {
            toast({ title: "Error", description: "Title is required.", variant: "destructive" });
            return;
        }

        const formData = new FormData();
        formData.append('title', post.title);
        formData.append('content', post.content);
        formData.append('type', post.type);
        (post.imageUrls || []).forEach(url => {
            formData.append('existingImageUrls', url);
        });
        const imageInput = document.getElementById('newImages') as HTMLInputElement;
        if (imageInput.files) {
            for (const file of Array.from(imageInput.files)) {
                formData.append('newImages', file);
            }
        }
        
        updatePostMutation.mutate({ formData, status }, {
            onSuccess: () => {
                router.push('/admin/posts');
            }
        });
    };
    
    const removeImage = (urlToRemove: string) => {
        if (post) {
            setPost({
                ...post,
                imageUrls: (post.imageUrls || []).filter(url => url !== urlToRemove)
            });
        }
    };


    if (!post) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const isPending = updatePostMutation.isPending;

    return (
        <div className="space-y-8">
             <Button asChild variant="outline">
              <Link href="/admin/posts">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Posts
              </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Post</CardTitle>
                    <CardDescription>You are currently editing the post: &quot;{post.title}&quot;</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label>Post Type</Label>
                        <RadioGroup 
                            name="type" 
                            value={post.type} 
                            onValueChange={(value) => setPost({...post, type: value as Post['type']})}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem value="NOTICE" id="type-notice" className="peer sr-only" />
                                <Label htmlFor="type-notice" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <Newspaper className="mb-3 h-6 w-6" />
                                    Notice
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="DASHBOARD_POST" id="type-dashboard" className="peer sr-only" />
                                <Label htmlFor="type-dashboard" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <ImageIcon className="mb-3 h-6 w-6" />
                                    Dashboard Post
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="post-title">Post Title</Label>
                        <Input 
                            id="post-title" 
                            placeholder="Enter a clear and concise title" 
                            value={post.title}
                            onChange={(e) => setPost({...post, title: e.target.value})}
                            disabled={isPending}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>Post Images</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(post.imageUrls || []).map((url, index) => (
                                <div key={index} className="relative group">
                                    <Image src={getValidImageSrc(url)} alt={`Existing image ${index + 1}`} width={200} height={120} className="rounded-md border object-cover w-full aspect-[16/9]" />
                                     <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                                        onClick={() => removeImage(url)} 
                                        disabled={isPending}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 mt-4">
                            <Label htmlFor="newImages" className="flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer">
                                <UploadCloud />
                                Add more images
                            </Label>
                            <Input id="newImages" name="newImages" type="file" multiple className="sr-only" disabled={isPending}/>
                            <p className="text-xs text-muted-foreground">Upload one or more new images for the post gallery.</p>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="post-content">Post Content</Label>
                        <Textarea 
                            id="post-content"
                            placeholder="Write the full content of the post here. You can use markdown for formatting."
                            rows={15}
                            value={post.content}
                            onChange={(e) => setPost({...post, content: e.target.value})}
                            disabled={isPending}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={() => handleSubmit('Draft')} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                         {isPending ? 'Saving...' : 'Save Draft Changes'}
                    </Button>
                     <Button onClick={() => handleSubmit('Published')} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {isPending ? 'Publishing...' : 'Update & Publish'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
