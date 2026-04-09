
import { getMemberDetails } from "@/services/prisma/queries/members";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PaymentClient } from "@/app/payment/payment-client";
import { getAdminRole } from "@/lib/auth";
import { getPaymentAccounts, getActiveEvents, getSettings } from "@/services/prisma/queries/admin";

const requiredRoles = ['super', 'transactions'];

export default async function AdminMakePaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const role = await getAdminRole();
    if (!role || !requiredRoles.includes(role)) {
        return (
            <div className="container mx-auto mt-10">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to access this page.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const [memberDetails, paymentAccounts, activeEvents, settings] = await Promise.all([
        getMemberDetails(id),
        getPaymentAccounts(),
        getActiveEvents(),
        getSettings(),
    ]);

    if (!memberDetails) {
        return (
            <Alert variant="destructive" className="max-w-xl mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Member</AlertTitle>
                <AlertDescription>
                    Could not load user details for payment.
                    <Button asChild variant="link">
                        <Link href={`/admin/members/${id}`}>Back to Member Details</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <PaymentClient 
            initialUserDetails={memberDetails}
            paymentAccounts={paymentAccounts}
            activeEvents={activeEvents}
            settings={settings!}
            isAdminView={true}
        />
    );
}

