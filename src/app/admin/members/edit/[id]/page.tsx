
import { getMemberById } from "@/services/prisma/queries/members";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EditMemberClient } from "./edit-member-client";


export default async function EditMemberAdminPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const memberDetails = await getMemberById(id);

    if (!memberDetails) {
        return (
            <Alert variant="destructive" className="max-w-xl mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Could not load user details.
                    <Button asChild variant="link">
                        <Link href={`/admin/members/${id}`}>Back to Member Details</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    return <EditMemberClient member={memberDetails} />;
}
