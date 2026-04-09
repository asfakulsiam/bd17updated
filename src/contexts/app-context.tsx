
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '@/hooks/use-settings';
import type { Settings } from '@/types';

interface AppContextType {
    settings: Settings | undefined;
    isInitialLoading: boolean;
    isFetching: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const { data: settings, isInitialLoading, isFetching } = useSettings();
    
    const value = {
        settings,
        isInitialLoading,
        isFetching,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
