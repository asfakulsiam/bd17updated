
import { getPosts } from '@/services/prisma/queries/posts';
import { PostClient } from '@/app/admin/posts/post-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { getAdminRole } from '@/lib/auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const requiredRoles = ['super', 'posts'];

export default async function PostsPage() {
  const role = await getAdminRole();
  if (!role || !requiredRoles.includes(role)) {
      return (
        <div className="container mx-auto mt-10">
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to access this page.
                </AlertDescription>
            </Alert>
        </div>
      )
  }

  const posts = await getPosts();

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline">Post Management</h1>
                <p className="text-muted-foreground">Create, edit, and publish posts for all members.</p>
            </div>
            <Button asChild>
                <Link href="/admin/posts/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Post
                </Link>
            </Button>
        </div>
        <PostClient initialPosts={posts} />
    </div>
  );
}
