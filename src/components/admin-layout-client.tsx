'use client';

import type { ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AdminHeader from '@/components/admin-header';
import { useSession } from '@/contexts/auth-context';
import { useAdmin } from '@/contexts/admin-context';

const AccessDenied = () => (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-destructive" />
                    Access Denied
                </CardTitle>
                <CardDescription>
                    You do not have permission to view this page.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p>Please contact a super administrator if you believe this is an error.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Return to Home</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
);

const AdminLayoutSkeleton = () => (
   <div className="flex flex-col min-h-svh">
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
                 <div className="h-6 w-32 bg-muted rounded-md animate-pulse"></div>
                 <div className="flex items-center gap-4">
                    <div className="h-6 w-24 bg-muted rounded-md animate-pulse hidden md:block"></div>
                    <div className="h-6 w-24 bg-muted rounded-md animate-pulse hidden md:block"></div>
                    <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                 </div>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </main>
    </div>
)

export default function AdminLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const { isAdmin, isLoading: sessionLoading } = useSession();
  const { isInitialLoading: adminDataLoading } = useAdmin();

  if (sessionLoading) {
    return <AdminLayoutSkeleton />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col min-h-svh bg-muted/40">
        <AdminHeader />
        <main className="flex-1 p-4 md:p-8 container mx-auto">
            {adminDataLoading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : children}
        </main>
    </div>
  );
}
