import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ShieldCheck,
  User,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuthState } from '../../Auth/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loadUnreadCount } from '../../Notifications/redux/notificationThunk';
import { selectUnreadCount } from '../../Notifications/redux/notificationSelector';
import { Button } from '../../../components/ui';

const LINKS = [
  { label: 'Dashboard', to: '/portal', icon: LayoutDashboard, end: true },
  { label: 'My profile', to: '/portal/profile', icon: User },
  { label: 'My communities', to: '/portal/communities', icon: UsersRound },
  { label: 'My committees', to: '/portal/committees', icon: ShieldCheck },
  { label: 'My events', to: '/portal/events', icon: CalendarDays },
  { label: 'My attendance', to: '/portal/attendance', icon: ClipboardCheck },
  { label: 'Content', to: '/portal/content', icon: FileText },
  { label: 'Announcements', to: '/portal/announcements', icon: Megaphone },
  { label: 'Documents', to: '/portal/documents', icon: FolderOpen },
];

/** Compact member portal shell: sidebar + sticky header + scrollable content. */
export function MemberLayout() {
  const [open, setOpen] = useState(false);
  const { displayName, initials, logout } = useAuthState();
  const unread = useAppSelector(selectUnreadCount);
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(loadUnreadCount());
  }, [dispatch]);

  const navigation = (
    <nav className="space-y-0.5" aria-label="Member navigation">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-primary-soft font-medium text-primary'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <link.icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-app-bg">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="border-b border-line p-3">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-2">{navigation}</div>
        <div className="border-t border-line p-2">
          <SignOutButton onSignOut={logout} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-white px-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </Button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-secondary">Member portal</p>
            <p className="truncate text-xs text-muted">HEAVENLY PATH SUNSARI DISTRICT</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/portal/notifications"
              className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            >
              <Bell className="h-4 w-4" aria-hidden />
              {unread > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
            <div className="flex items-center gap-2 rounded-lg px-1.5 py-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {initials || 'M'}
              </span>
              <span className="hidden text-sm font-medium text-slate-700 sm:block">{displayName}</span>
            </div>
          </div>
        </header>

        {open && (
          <div className="border-b border-line bg-white p-2 lg:hidden">
            {navigation}
            <SignOutButton onSignOut={logout} />
          </div>
        )}

        <main className="flex-1 p-3 lg:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
        HP
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-secondary">HEAVENLY PATH</p>
        <p className="truncate text-xs text-muted">Member portal</p>
      </div>
    </div>
  );
}

function SignOutButton({ onSignOut }: { onSignOut: () => void }) {
  return (
    <button
      type="button"
      onClick={() => void onSignOut()}
      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-danger"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Sign out
    </button>
  );
}

export default MemberLayout;
