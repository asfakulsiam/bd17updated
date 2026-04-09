
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPendingProfileUpdates } from "@/services/prisma/queries/admin";
import { getAdminRole } from "@/lib/auth";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { ProfileUpdateRequestClient } from "../dashboard/profile-update-client";

const requiredRoles = ['super', 'members'];

export default async function PendingUpdatesPage() {
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
    
    const pendingUpdates = await getPendingProfileUpdates();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Profile Updates</CardTitle>
                <CardDescription>Members have requested changes to their profiles. Please review them.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProfileUpdateRequestClient initialRequests={pendingUpdates} />
            </CardContent>
        </Card>
    );
}
