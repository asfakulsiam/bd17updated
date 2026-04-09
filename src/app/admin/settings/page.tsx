
import { getSettings, getAdmins, getPaymentAccounts, getActiveEvents } from '@/services/prisma/queries/admin';
import { getAdminRole } from '@/lib/auth';
import { SettingsClient } from './settings-client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

const requiredRoles = ['super'];

export default async function SettingsPage() {
    const role = await getAdminRole();
    if (!role || !requiredRoles.includes(role)) {
        return (
            <div className="container mx-auto mt-10">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to access this page. This action is restricted to Super Admins.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const [settings, admins, paymentAccounts, events] = await Promise.all([
        getSettings(),
        getAdmins(),
        getPaymentAccounts(),
        getActiveEvents(),
    ]);

    return (
        <SettingsClient 
            initialSettings={settings!}
            initialAdmins={admins}
            currentAdminRole={role}
            initialPaymentAccounts={paymentAccounts}
            initialEvents={events}
        />
    )
}
