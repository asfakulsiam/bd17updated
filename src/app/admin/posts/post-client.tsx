

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { Post } from '@/types';
import { toast } from '@/hooks/use-toast';
import { deletePost as deletePostAction } from '@/lib/actions/posts';

export function PostClient({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const deletePost = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      try {
        // Optimistic UI update
        setPosts(prevPosts => prevPosts.filter(p => p.id !== id));
        await deletePostAction(id);
        toast({title: "Post Deleted"});
      } catch (error) {
        toast({title: "Error", description: (error as Error).message, variant: "destructive"});
        // Revert UI change on error
        setPosts(initialPosts);
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
        <Card>
            <CardHeader>
                <CardTitle>Published & Draft Posts</CardTitle>
                <CardDescription>Manage all site-wide posts and announcements from here.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posts.map((post) => (
                            <TableRow key={post.id}>
                                <TableCell className="font-medium">{post.title}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{post.type === 'DASHBOARD_POST' ? 'Dashboard Post' : 'Notice'}</Badge>
                                </TableCell>
                                <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={post.status === 'Published' ? 'default' : 'secondary'} className={post.status === 'Published' ? 'bg-green-500/80' : 'bg-yellow-500/80'}>
                                        {post.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {(isPending && deletingId === post.id) ? <Loader2 className='h-4 w-4 animate-spin ml-auto' /> : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/admin/posts/edit/${post.id}`)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the post.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deletePost(post.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
  );
}
