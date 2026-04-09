

'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ProfileUpdateRequestClient } from "./profile-update-client";
import { useSession } from '@/contexts/auth-context';
import { usePendingProfileUpdates } from '@/hooks/use-admin';
import { StatCard, StatCardSkeleton, ActionCard } from './stat-cards';
import { useAdmin } from "@/contexts/admin-context";

export function DashboardClient() {
    const { adminRole } = useSession();
    const { stats, isInitialLoading: statsLoading } = useAdmin();
    const { data: profileUpdates, isLoading: updatesLoading } = usePendingProfileUpdates();

    const canView = (requiredRoles: Array<string>) => {
        if (!adminRole) return false;
        return adminRole === 'super' || requiredRoles.includes(adminRole);
    };

    if (statsLoading || updatesLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, Admin! Here&apos;s an overview of your application.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                   <StatCardSkeleton />
                   <StatCardSkeleton />
                   <StatCardSkeleton />
                   <StatCardSkeleton />
                </div>
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Pending Actions</CardTitle>
                        <CardDescription>Items that require your immediate attention.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!stats) {
         return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Could not load dashboard statistics. Please try refreshing the page.</p>
                </div>
            </div>
         )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, Admin! Here&apos;s an overview of your application.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Members"
                    value={stats.totalMembers.toString()}
                    description={`${stats.approvedMembers} active members`}
                    condition={canView(['members'])}
                />
                 <StatCard
                    title="Current Month Paid Status"
                    value={`${stats.paidThisMonth}`}
                    description="Members fully paid for current month"
                    condition={canView(['transactions'])}
                 />
                 <StatCard
                    title="Active Loans"
                    value={`৳${stats.activeLoanTotal.toLocaleString()}`}
                    description="Total amount loaned out"
                    condition={canView(['loans'])}
                 />
                 <StatCard
                    title="Total Savings Fund (Cash)"
                    value={`৳${stats.totalSavingsFund.toLocaleString()}`}
                    description="Total cash after deducting active loans"
                    condition={canView(['transactions'])}
                 />
                <StatCard
                    title="Other Funds"
                    value={`৳${stats.otherFundsTotal.toLocaleString()}`}
                    description="Funds from events, fees, etc."
                    condition={canView(['transactions'])}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <Card className="lg:col-span-3" id="pending-actions">
                    <CardHeader>
                        <CardTitle>Pending Actions</CardTitle>
                        <CardDescription>Items that require your immediate attention.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <ActionCard
                           href="/admin/members?status=Pending"
                           label="Member Approvals"
                           count={stats.pendingMemberActions}
                           condition={canView(['members'])}
                       />
                       <ActionCard
                           href="/admin/loans?status=pending"
                           label="Loan Requests"
                           count={stats.pendingLoansCount}
                           condition={canView(['loans'])}
                       />
                       <ActionCard
                           href="/admin/transactions?tab=pending"
                           label="Payment Verifications"
                           count={stats.pendingPaymentsCount}
                           condition={canView(['transactions'])}
                       />
                       <ActionCard
                           href="/admin/pending-updates"
                           label="Profile Updates"
                           count={stats.pendingProfileUpdatesCount}
                           condition={canView(['members'])}
                       />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
