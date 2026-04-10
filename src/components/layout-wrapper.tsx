
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
        <div className="relative flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
            {!isAdminRoute && <Header />}
            <main className={cn(
                "flex-1 w-full",
                !isAdminRoute && "container py-8 md:py-12"
            )}>
                {children}
            </main>
            {!isAdminRoute && <Footer />}
        </div>
    );
}
