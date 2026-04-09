
import { getUserDetails } from "@/services/prisma/queries/members";
import { getSettings, getPaymentAccounts, getActiveEvents } from "@/services/prisma/queries/admin";
import { PaymentClient } from "./payment-client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserPlus } from "lucide-react";
import { auth } from "@clerk/nextjs/server";


export default async function PaymentPage() {
    const { userId } = await auth();
    const userDetails = await getUserDetails();

    if (!userId || !userDetails?.details || userDetails.details.status !== 'Approved') {
         return (
             <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
                <div className="bg-primary/10 p-6 rounded-full">
                    <UserPlus className="w-16 h-16 text-primary" />
                </div>
                 <h1 className="font-headline text-3xl font-bold">You must be an approved member</h1>
                 <p className="text-muted-foreground max-w-md">To make a payment, you must be a registered and approved member.</p>
                 <Button asChild variant="link">
                    <Link href="/registration">Register Now</Link>
                 </Button>
             </div>
        );
    }
    
    const [settings, paymentAccounts, activeEvents] = await Promise.all([
        getSettings(),
        getPaymentAccounts(),
        getActiveEvents(),
    ]);

    if (!settings) {
        return (
            <Alert variant="destructive" className="max-w-xl mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>
                    Could not load the necessary settings for payments. Please try again later.
                </AlertDescription>
            </Alert>
        )
    }

    return <PaymentClient 
        initialUserDetails={userDetails}
        paymentAccounts={paymentAccounts}
        activeEvents={activeEvents}
        settings={settings}
        isAdminView={false}
    />;
}
