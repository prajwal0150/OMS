import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import { loadUnreadCount } from '../../../Notifications/redux/notificationThunk';
import { selectUnreadCount } from '../../../Notifications/redux/notificationSelector';
import { loadDashboard } from '../../Dashboard/redux/dashboardThunk';
import { ROLE_LABEL } from '../../../../types';
import { Button } from '../../../../components/ui';
import GlobalSearch from './GlobalSearch';

export interface AdminHeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

/** Compact header: `h-12`, toggle + title + search + notifications + profile. */
export function AdminHeader({ onToggleSidebar, title }: AdminHeaderProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { displayName, initials, role, logout, isSuperAdmin } = useAuthState();
  const unread = useAppSelector(selectUnreadCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void dispatch(loadUnreadCount());
    void dispatch(loadDashboard(undefined));
  }, [dispatch]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const scopeLine = isSuperAdmin
    ? 'Organization-wide access'
    : 'Scoped to your assigned district, unit or community';

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-white px-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="lg:hidden"
        aria-label="Toggle navigation"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </Button>

      <div className="hidden min-w-0 shrink-0 sm:block">
        <p className="truncate text-sm font-semibold text-secondary">{title ?? 'Admin Console'}</p>
        <p className="truncate text-xs text-muted">{scopeLine}</p>
      </div>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2">
        <div className="hidden max-w-sm flex-1 md:block">
          <GlobalSearch />
        </div>

        <Link
          to="/admin/notifications"
          className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="h-4 w-4" aria-hidden />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {initials || 'U'}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-32 truncate text-sm font-medium text-slate-800">
                {displayName}
              </span>
              <span className="block text-xs text-muted">{role ? ROLE_LABEL[role] : ''}</span>
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" aria-hidden />
          </button>

          {menuOpen && (
            <div role="menu" className="absolute right-0 mt-1 w-56 rounded-lg border border-line bg-white p-1 shadow-lg">
              <div className="border-b border-line px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-800">{displayName}</p>
                <p className="truncate text-xs text-muted">{role ? ROLE_LABEL[role] : ''}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/portal/profile');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                <User className="h-3.5 w-3.5" aria-hidden />
                My profile
              </button>
              <Link
                to="/admin/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => void logout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
