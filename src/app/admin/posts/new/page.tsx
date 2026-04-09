

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Send, UploadCloud, Newspaper, Image as ImageIcon } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createPost } from '@/lib/actions/posts';
import { PostStatus, PostType } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function NewPostPage() {
    const [images, setImages] = useState<File[]>([]);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (status: PostStatus) => {
        startTransition(async () => {
            const form = document.querySelector('form');
            if (!form) return;

            const formData = new FormData(form);
            
            // Re-append files because state isn't automatically part of FormData
            images.forEach(image => {
                formData.append('newImages', image);
            });
            
            if (!formData.get('title')) {
                 toast({ title: "Error", description: "Title is required.", variant: "destructive" });
                 return;
            }
             if (status === 'Published' && !formData.get('content')) {
                 toast({ title: "Error", description: "Content is required for publishing.", variant: "destructive" });
                 return;
            }
             if (!formData.get('type')) {
                toast({ title: "Error", description: "Post type is required.", variant: "destructive" });
                return;
            }

            try {
                await createPost(formData, status);
                toast({
                    title: status === 'Published' ? "Post Published" : "Draft Saved",
                    description: "Your post has been successfully saved.",
                });
                router.push('/admin/posts');
            } catch (error) {
                toast({
                    title: "Error creating post",
                    description: (error as Error).message,
                    variant: "destructive"
                });
            }
        });
    };


    return (
        <div className="space-y-8">
             <Button asChild variant="outline">
              <Link href="/admin/posts">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Posts
              </Link>
            </Button>
            <form>
                 <Card>
                    <CardHeader>
                        <CardTitle>Create New Post</CardTitle>
                        <CardDescription>Compose a new notice or dashboard post for all members.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Post Type</Label>
                            <RadioGroup name="type" defaultValue="NOTICE" className="grid grid-cols-2 gap-4">
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
                                name="title"
                                placeholder="Enter a clear and concise title" 
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newImages" className="flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer">
                                <UploadCloud />
                                Upload Post Images
                            </Label>
                            <Input id="newImages" name="newImages" type="file" multiple onChange={handleFileChange} className="sr-only" disabled={isPending}/>
                            <p className="text-xs text-muted-foreground">Upload one or more images for the post gallery.</p>
                            {images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                    {images.map((file, index) => (
                                        <div key={index}>
                                            <Image 
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${index + 1}`}
                                                width={200}
                                                height={120}
                                                className="rounded-md object-cover w-full aspect-[16/9]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="post-content">Post Content</Label>
                            <Textarea 
                                id="post-content"
                                name="content"
                                placeholder="Write the full content of the post here. You can use markdown for formatting."
                                rows={15}
                                disabled={isPending}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4">
                        <Button type="button" variant="secondary" onClick={() => handleSubmit('Draft')} disabled={isPending}>
                            <Save className="mr-2 h-4 w-4" />
                            {isPending ? 'Saving...' : 'Save as Draft'}
                        </Button>
                        <Button type="button" onClick={() => handleSubmit('Published')} disabled={isPending}>
                            <Send className="mr-2 h-4 w-4" />
                            {isPending ? 'Publishing...' : 'Publish Post'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
