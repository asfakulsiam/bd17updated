'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type { User } from '@clerk/nextjs/api';
import { useQueryClient } from '@tanstack/react-query';

interface SessionContextType {
  user: User | null | undefined;
  userId: string | null | undefined;
  isAdmin: boolean;
  adminRole: string | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();

  const getAdminRole = () => {
    if (!user || !isLoaded) return null;
    const role = (user.publicMetadata as any)?.role;
    const subrole = (user.publicMetadata as any)?.subrole;

    if (role === 'super') return 'super';
    if (role === 'admin' && subrole) return subrole;
    return null;
  };
  
  const adminRole = getAdminRole();

  useEffect(() => {
    // When the user changes (login/logout), invalidate queries to refetch user-specific data
    queryClient.invalidateQueries();
  }, [user?.id, queryClient]);

  const value = {
    user,
    userId: user?.id,
    isAdmin: !!adminRole,
    adminRole,
    isLoading: !isLoaded,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
