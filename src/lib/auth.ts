

'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { AdminUser } from '@/types';

/**
 * Gets the admin role of the currently authenticated user.
 * This is a server-only function that checks both environment variables for super admin
 * and Clerk metadata for other admin roles.
 * @returns {Promise<AdminUser['role'] | null>} The user's admin role or null if not an admin or not logged in.
 */
export async function getAdminRole(): Promise<AdminUser['role'] | null> {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;

    // First, check if the user is the designated Super Admin via environment variable.
    // This is the most reliable check and overrides any metadata.
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
        try {
            const client = await clerkClient();
            const user = await client.users.getUser(userId);
            const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
            if (primaryEmail === superAdminEmail) {
                return 'super';
            }
        } catch (error) {
            console.error("Failed to fetch user for super admin check:", error);
        }
    }

    // If not the super admin by email, check the custom claims in the JWT.
    const role = sessionClaims?.metadata?.role as string | undefined;
    const subrole = sessionClaims?.metadata?.subrole as string | undefined;

    if (role === 'super') {
        return 'super';
    }
    
    if (role === 'admin' && subrole) {
        return subrole as AdminUser['role'];
    }

    return null;
}
