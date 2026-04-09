
import type { ReactNode } from 'react';
import AdminLayoutClient from '@/components/admin-layout-client';
import { AdminProvider } from '@/contexts/admin-context';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
      <AdminProvider>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </AdminProvider>
  );
}
