
import { getUserLoanData } from "@/services/prisma/queries/loans";
import { getOrganizationLoanData } from "@/services/prisma/queries/loans";
import { getSettings } from "@/services/prisma/queries/admin";
import { LoanClient } from "./loan-client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, UserPlus } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@clerk/nextjs/server';
import { getUserDetails } from "@/services/prisma/queries/members";

export default async function LoanPage() {
  const { userId } = await auth();

  if (!userId) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h1 className="text-2xl font-bold">Please Log In</h1>
            <p className="text-muted-foreground">You must be logged in to view loan information.</p>
            <Button asChild className="mt-4">
                <Link href="/sign-in">Sign In</Link>
            </Button>
        </div>
      )
  }

  const userDetails = await getUserDetails();

  if (!userDetails || userDetails.details.status !== 'Approved') {
        return (
             <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
                <div className="bg-primary/10 p-6 rounded-full">
                    <UserPlus className="w-16 h-16 text-primary" />
                </div>
                 <h1 className="font-headline text-3xl font-bold">You must be an approved member</h1>
                 <p className="text-muted-foreground max-w-md">To view loan information, you must be a registered and approved member.</p>
                 <Button asChild variant="link">
                    <Link href="/registration">Register Now</Link>
                 </Button>
             </div>
        );
  }
  
  const [loanData, orgLoanData, settings] = await Promise.all([
    getUserLoanData(),
    getOrganizationLoanData(),
    getSettings()
  ]);

  if (!loanData || !orgLoanData || !settings) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Alert variant="destructive" className="max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Could not load loan data</AlertTitle>
              <AlertDescription>
                There was an error fetching the necessary information. Please try refreshing the page or contact support if the problem persists.
              </AlertDescription>
            </Alert>
        </div>
    )
  }

  return <LoanClient loanData={loanData} orgLoanData={orgLoanData} settings={settings} />;
}
