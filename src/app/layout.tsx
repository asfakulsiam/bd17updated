import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from '@clerk/nextjs';
import Providers from "@/components/providers";
import LayoutWrapper from "@/components/layout-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "বন্ধন’১৭",
  description: "A minimal organization management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="bn" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        </head>
        <body className={cn("bg-background font-body antialiased")}>
          <Providers>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
