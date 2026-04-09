
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getMembersList } from '@/services/prisma/queries/members';
import { MemberClient } from './member-client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus, ShieldAlert } from "lucide-react";
import { getAdminRole } from "@/lib/auth";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const requiredRoles = ['super', 'members'];

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
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
  
  const canAddMembers = role === 'super' || role === 'members';
  const statusParam = resolvedSearchParams?.status as string | undefined;

  return (
      <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                  <h1 className="text-3xl font-bold font-headline">Member Management</h1>
                  <p className="text-muted-foreground">View, approve, and manage member details.</p>
              </div>
              {canAddMembers && (
                  <Button asChild>
                      <Link href="/admin/members/new">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Member by Clerk ID
                      </Link>
                  </Button>
              )}
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Members List</CardTitle>
                  <CardDescription>Select a tab to filter members by their status.</CardDescription>
              </CardHeader>
              <CardContent>
                  <MemberClient defaultTab={statusParam || 'pending'} />
              </CardContent>
          </Card>
      </div>
  );
}
