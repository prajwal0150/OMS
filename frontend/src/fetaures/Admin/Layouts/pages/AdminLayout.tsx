import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';

/**
 * Admin shell: compact sidebar + header + scrollable content area.
 * The shell is shared by all three admin panels. The sidebar renders whatever
 * `sectionsForRole` returns for the signed-in role, so each panel shows only
 * its own navigation - see `config/panelNavigation.ts`.
 *
 * Scrolling is confined to `<main>`: the outer box is pinned to the viewport
 * height so the sidebar can never be pushed off, and `min-h-0` on `<main>`
 * lets it shrink below its content size, which is what actually engages the
 * scrollbar. A flex child keeps `min-height: auto` otherwise, so the whole
 * document would scroll instead.
 */
export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
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
