
"use client";

import Link from "next/link";
import { Home, Users, PiggyBank, Receipt, Megaphone, Settings, MessageSquare, Menu, CheckSquare, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { useApp } from "@/contexts/app-context";
import { useSession } from "@/contexts/auth-context";
import { getValidImageSrc } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { useAdmin } from "@/contexts/admin-context";

const allAdminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home, roles: ['super', 'members', 'loans', 'transactions', 'posts', 'messaging'], id: 'dashboard' },
  { href: '/admin/pending-updates', label: 'Pending Updates', icon: Edit, roles: ['super', 'members'], id: 'pending-updates' },
  { href: '/admin/paid-status', label: 'Paid Status', icon: CheckSquare, roles: ['super', 'transactions'], id: 'paid-status' },
  { href: '/admin/members', label: 'Members', icon: Users, roles: ['super', 'members'], id: 'members' },
  { href: '/admin/loans', label: 'Loans', icon: PiggyBank, roles: ['super', 'loans'], id: 'loans' },
  { href: '/admin/transactions', label: 'Transactions', icon: Receipt, roles: ['super', 'transactions'], id: 'transactions' },
  { href: '/admin/posts', label: 'Posts', icon: Megaphone, roles: ['super', 'posts'], id: 'posts' },
  { href: '/admin/messaging', label: 'Messaging', icon: MessageSquare, roles: ['super', 'messaging'], id: 'messaging' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['super'], id: 'settings' },
];

const getVisibleLinks = (role: string | null) => {
    if (!role) return [];
    if (role === 'super') {
        return allAdminNavLinks;
    }
    return allAdminNavLinks.filter(link => link.roles.includes(role));
};


const NavLink = ({ href, label, count }: { href: string; label: string; count?: number }) => {
    const pathname = usePathname();
    const isActive = href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href);
    return (
        <Link
          href={href}
          className={cn(
            "flex items-center gap-2 transition-colors hover:text-primary",
            isActive ? "text-primary font-semibold" : "text-foreground/60"
          )}
        >
          {label}
          {count !== undefined && count > 0 && (
            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {count}
            </Badge>
          )}
        </Link>
    )
}

const MobileNavLink = ({ href, label, icon: Icon, count, closeSheet }: { href: string; label: string; icon: React.ElementType, count?: number; closeSheet: () => void }) => {
    const pathname = usePathname();
    const isActive = href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href);
    return (
        <Link
          href={href}
          onClick={closeSheet}
          className={cn(
            "flex items-center gap-2 transition-colors hover:text-primary p-2 rounded-md",
            isActive ? "text-primary bg-muted font-semibold" : "text-foreground/80"
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
          {count !== undefined && count > 0 && (
            <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {count}
            </Badge>
          )}
        </Link>
    )
}

export default function AdminHeader() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { adminRole } = useSession();
  const { settings, isInitialLoading: appLoading } = useApp();
  const { stats } = useAdmin();
  const visibleLinks = getVisibleLinks(adminRole);
  
  const getCountForLink = (id: string) => {
    if (!stats) return undefined;
    if (id === 'pending-updates') return stats.pendingProfileUpdatesCount;
    if (id === 'members') return stats.pendingMemberActions;
    if (id === 'loans') return stats.pendingLoansCount;
    if (id === 'transactions') return stats.pendingPaymentsCount;
    return undefined;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="md:hidden mr-4">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px]">
              <div className="p-4">
                <div className="mb-6">
                  {appLoading ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <span className="font-bold font-headline text-xl">{settings?.siteTitle || "বন্ধন'১৭"} Admin</span>
                  )}
                </div>
                <nav className="flex flex-col gap-2">
                  {visibleLinks.map(({ href, label, icon, id }) => (
                    <MobileNavLink
                      key={href}
                      href={href}
                      label={label}
                      icon={icon}
                      count={getCountForLink(id)}
                      closeSheet={() => setIsSheetOpen(false)}
                    />
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          {visibleLinks.map(({ href, label, id }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              count={getCountForLink(id)}
            />
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
            <ThemeSwitcher />
            <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
