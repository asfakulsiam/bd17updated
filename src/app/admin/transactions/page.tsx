
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionClient } from './transaction-client';
import { getAdminRole } from "@/lib/auth";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

const requiredRoles = ['super', 'transactions'];

export default async function TransactionsPage() {
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
          <CardTitle>Transaction Management</CardTitle>
          <CardDescription>Review manual payments and view all transactions. Click the action button to see details.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionClient />
        </CardContent>
      </Card>
  );
}
