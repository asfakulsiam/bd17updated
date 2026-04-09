'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAdminDashboardStats } from '@/hooks/use-admin';
import type { AdminDashboardStats } from '@/types';
import { useSession } from './auth-context';

interface AdminContextType {
    stats: AdminDashboardStats | null | undefined;
    isInitialLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const { isAdmin } = useSession();
    // Only fetch stats if the user is an admin
    const { data: stats, isLoading: statsLoading } = useAdminDashboardStats(isAdmin);

    const value = {
        stats,
        isInitialLoading: statsLoading,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
