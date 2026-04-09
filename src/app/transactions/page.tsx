
import { getUserDetails } from "@/services/prisma/queries/members";
import { getOrganizationLoanData } from "@/services/prisma/queries/loans";
import { TransactionClient } from "./transaction-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, UserPlus } from "lucide-react";
import { getUserPaymentHistory } from "@/services/prisma/queries/transactions";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default async function TransactionsPage() {
  const userDetails = await getUserDetails();

  if (!userDetails || userDetails.details.status !== 'Approved') {
        return (
             <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
                <div className="bg-primary/10 p-6 rounded-full">
                    <UserPlus className="w-16 h-16 text-primary" />
                </div>
                 <h1 className="font-headline text-3xl font-bold">You must be an approved member</h1>
                 <p className="text-muted-foreground max-w-md">To view your transactions, you must be a registered and approved member.</p>
                 <Button asChild variant="link">
                    <Link href="/registration">Register Now</Link>
                 </Button>
             </div>
        );
  }
  
  const [historyData, orgData] = await Promise.all([
      getUserPaymentHistory(),
      getOrganizationLoanData(),
  ]);

  if (!historyData || !orgData) {
      return (
        <Alert variant="destructive" className="max-w-xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>Transaction data could not be retrieved at this time. Please try again later.</AlertDescription>
        </Alert>
      )
  }

  return (
    <TransactionClient 
        history={historyData} 
        orgDetails={orgData}
        userDetails={userDetails}
    />
  );
}
