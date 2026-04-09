
'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminDashboardStats, ProfileUpdateWithMember } from '@/types';
import { getAdminDashboardStats, getPendingProfileUpdates } from '@/services/prisma/queries/admin';


export function useAdminDashboardStats(enabled: boolean = true) {
    return useQuery<AdminDashboardStats | null>({
        queryKey: ['adminDashboardStats'],
        queryFn: () => getAdminDashboardStats(),
        enabled: enabled, // Only run the query if `enabled` is true
    });
}


export function usePendingProfileUpdates() {
    return useQuery<ProfileUpdateWithMember[]>({
        queryKey: ['pendingProfileUpdates'],
        queryFn: getPendingProfileUpdates,
    });
}
