
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeSwitcher } from "./theme-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/auth-context";
import { useUnreadCounts } from "@/hooks/use-messages";
import { useApp } from "@/contexts/app-context";
import Image from "next/image";
import { UserButton, useUser, ClerkLoaded } from "@clerk/nextjs";
import { getValidImageSrc } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

const navLinks = {
  bn: [
    { href: "/account", label: "আমার অ্যাকাউন্ট" },
    { href: "/transactions", label: "লেনদেন ও হিসাব বিবরনি" },
    { href: "/loan", label: "লোন স্ট্যাটাস" },
    { href: "/payment", label: "পেমেন্ট" },
    { href: "/notices", label: "নোটিশ বোর্ড", id: "notices" },
    { href: "/inbox", label: "ইনবক্স", id: "inbox" },
    { href: "/policy", label: " নীতিমালা" },
  ],
  en: [
    { href: "/account", label: "My Account" },
    { href: "/transactions", label: "Transactions" },
    { href: "/loan", label: "Loan Status" },
    { href: "/payment", label: "Payment" },
    { href: "/notices", label: "Notice Board", id: "notices" },
    { href: "/inbox", label: "Inbox", id: "inbox" },
    { href: "/policy", label: "Policy" },
  ],
};

const NavLink = ({ href, label, count }: { href: string; label: string; count?: number }) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
        <Link
          href={href}
          className={cn(
            "flex items-center gap-2 transition-colors hover:text-primary",
            isActive ? "text-primary font-medium" : "text-foreground/60"
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

const MobileNavLink = ({ href, label, count, closeMobileMenu }: { href: string; label: string; count?: number; closeMobileMenu: () => void; }) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
        <Link
          href={href}
          onClick={closeMobileMenu}
          className={cn(
            "flex items-center justify-between text-lg transition-colors hover:text-primary",
            isActive ? "text-primary font-medium" : "text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            {label}
            {count !== undefined && count > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                  {count}
              </Badge>
            )}
          </span>
        </Link>
    )
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language } = useLanguage();
  const links = navLinks[language];
  const { userId } = useSession();
  const { data: counts } = useUnreadCounts(userId);
  const { settings, isInitialLoading } = useApp();
  
  const { isSignedIn } = useUser();
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const Logo = () => {
    if (isInitialLoading || !settings) {
      return (
        <>
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-24" />
        </>
      )
    }
    return (
        <>
            <Image src={getValidImageSrc(settings.logoUrl)} alt="Site Logo" width={32} height={32} className="rounded-md" data-ai-hint="logo" />
            <span className="font-bold font-headline text-xl">{settings.siteTitle || "বন্ধন&apos;১৭"}</span>
        </>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm">
          {links.map(({ href, label, id }) => (
            <NavLink
                key={href}
                href={href}
                label={label}
                count={id === 'inbox' ? counts?.inbox : id === 'notices' ? counts?.notices : undefined}
            />
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
            <div className="hidden md:flex items-center space-x-2">
                <ClerkLoaded>
                    {isSignedIn ? (
                        <UserButton afterSignOutUrl="/" />
                    ) : (
                        <Button asChild size="sm">
                            <Link href="/sign-in">Sign In</Link>
                        </Button>
                    )}
                </ClerkLoaded>
                <LanguageSwitcher />
                <ThemeSwitcher />
            </div>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="h-full flex flex-col">
                  <SheetHeader className="border-b pb-4">
                    <SheetTitle>
                      <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                          <Logo />
                      </Link>
                    </SheetTitle>
                    <SheetDescription>
                      {language === 'bn' ? 'নেভিগেশন মেনু' : 'Navigation Menu'}
                    </SheetDescription>
                  </SheetHeader>
                    <nav className="flex flex-col space-y-4 mt-6">
                      {links.map(({ href, label, id }) => (
                        <MobileNavLink
                          key={href}
                          href={href}
                          label={label}
                          count={id === 'inbox' ? counts?.inbox : id === 'notices' ? counts?.notices : undefined}
                          closeMobileMenu={closeMobileMenu}
                        />
                      ))}
                    </nav>
                   <div className="flex items-center justify-center space-x-4 pt-4 border-t mt-auto">
                      <ClerkLoaded>
                          {isSignedIn ? (
                              <UserButton afterSignOutUrl="/" />
                          ) : (
                              <Button asChild>
                                <Link href="/sign-in">Sign In</Link>
                              </Button>
                          )}
                      </ClerkLoaded>
                      <LanguageSwitcher />
                      <ThemeSwitcher />
                   </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
