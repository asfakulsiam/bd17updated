
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMonthlyPaymentStatus } from '@/services/prisma/queries/admin';
import { getAdminRole } from "@/lib/auth";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { PaidStatusClient } from './paid-status-client';

const requiredRoles = ['super', 'transactions'];

export default async function PaidStatusPage() {
    const role = await getAdminRole();
    if (!role || !requiredRoles.includes(role)) {
        return (
            <div className="container mx-auto mt-10">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>You do not have permission to access this page.</AlertDescription>
                </Alert>
            </div>
        )
    }

    const today = new Date();
    const paymentStatus = await getMonthlyPaymentStatus();
    const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-3xl font-bold font-headline">Monthly Paid Status</h1>
                <p className="text-muted-foreground">Payment status for monthly savings for {monthName}.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Tabs defaultValue="unpaid">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="unpaid">Unpaid ({paymentStatus.unpaid.length})</TabsTrigger>
                            <TabsTrigger value="paid">Paid ({paymentStatus.paid.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="unpaid">
                            <PaidStatusClient members={paymentStatus.unpaid} month={monthName} type="unpaid" />
                        </TabsContent>
                        <TabsContent value="paid">
                             <PaidStatusClient members={paymentStatus.paid} month={monthName} type="paid" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
