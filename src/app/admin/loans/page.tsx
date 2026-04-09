
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanClient } from './loan-client';
import { getAdminRole } from "@/lib/auth";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

const requiredRoles = ['super', 'loans'];

export default async function LoansPage() {
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
  
  return (
      <Card>
        <CardHeader>
          <CardTitle>Loan Management</CardTitle>
          <CardDescription>Review and approve member loan applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoanClient />
        </CardContent>
      </Card>
  );
}
