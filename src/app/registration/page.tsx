
import { RegistrationClient } from "./registration-client";
import { getUserDetails } from "@/services/prisma/queries/members";
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export default async function RegistrationPage() {
    const { userId } = await auth();
    // Fetch details only if the user is logged in.
    const userDetails = userId ? await getUserDetails() : null;
    return (
        <RegistrationClient member={userDetails?.details || null} />
    );
}
