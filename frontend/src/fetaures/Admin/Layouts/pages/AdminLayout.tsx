import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';

/**
 * Admin shell: compact sidebar + sticky header + scrollable content area.
 * The same layout serves Super Admin, District Admin, Unit Admin,
 * Community Coordinator and Committee Member - navigation is permission driven.
 */
export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-app-bg">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="flex-1 p-3 lg:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export interface AdminPageProps {
  children: ReactNode;
}

export function AdminPage({ children }: AdminPageProps) {
  return <div className="space-y-3">{children}</div>;
}

export default AdminLayout;
