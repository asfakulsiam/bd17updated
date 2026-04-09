
import { getUserDetails } from "@/services/prisma/queries/members";
import { EditClient } from "./edit-client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function EditAccountPage() {
    const userDetails = await getUserDetails();

    if (!userDetails?.details) {
        return (
            <Alert variant="destructive" className="max-w-xl mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Could not load user details. Please try logging in again.
                    <Button asChild variant="link">
                        <Link href="/account">Back to Account</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    return <EditClient userDetails={userDetails.details} />;
}
