
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { UserCheck, PiggyBank, FileText, Edit } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export const StatCard = ({ title, value, description, condition }: { title: string, value: string, description: string, condition: boolean }) => {
    if (!condition) return null;
    return (
        <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
};

export const StatCardSkeleton = () => (
     <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-full" />
        </CardContent>
    </Card>
)

export const ActionCard = ({ href, label, count, condition }: { href: string, label: string, count: number, condition: boolean }) => {
    if (!condition || count === 0) return null;

    const iconMap: { [key: string]: React.ReactNode } = {
        "Member Approvals": <UserCheck className="mx-auto h-8 w-8 text-yellow-600 mb-2"/>,
        "Loan Requests": <PiggyBank className="mx-auto h-8 w-8 text-blue-600 mb-2"/>,
        "Payment Verifications": <FileText className="mx-auto h-8 w-8 text-green-600 mb-2"/>,
        "Profile Updates": <Edit className="mx-auto h-8 w-8 text-purple-600 mb-2" />
    };
    
    const content = (
        <div className="p-4 border rounded-lg text-center hover:bg-muted transition-colors h-full flex flex-col justify-center">
            {iconMap[label]}
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    );

    return (
        <Link href={href} className="block">
            {content}
        </Link>
    );
};
