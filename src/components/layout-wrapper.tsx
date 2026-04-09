
"use client";

import { usePathname } from 'next/navigation';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith('/admin');

    return (
        <div className="relative flex flex-col" style={{ minHeight: '100svh' }}>
            {!isAdminRoute && <Header />}
            <main className={cn("flex-1", !isAdminRoute && "container py-8")}>
                {children}
            </main>
            {!isAdminRoute && <Footer />}
        </div>
    );
}
