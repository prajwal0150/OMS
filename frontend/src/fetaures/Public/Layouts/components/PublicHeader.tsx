import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import { ORGANIZATION_NAME, ORGANIZATION_SHORT_NAME } from '../../../../constants';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'District', to: '/district' },
  { label: 'Units', to: '/units' },
  { label: 'Communities', to: '/communities' },
  { label: 'Events', to: '/events' },
  { label: 'Activities', to: '/content' },
  { label: 'Announcements', to: '/announcements' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' },
];

/** Responsive public header - compact on mobile, inline nav on desktop. */
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, role } = useAuthState();

  useEffect(() => {
    setOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
            HP
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-secondary">
              {ORGANIZATION_SHORT_NAME}
            </span>
            <span className="hidden truncate text-xs text-muted sm:block">Sunsari District, Nepal</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-soft font-medium text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Link
            to={isAuthenticated ? (role === 'MEMBER' ? '/portal' : '/admin') : '/login'}
            className="hidden rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover sm:block"
          >
            {isAuthenticated ? 'Open dashboard' : 'Sign in'}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white p-2 lg:hidden" aria-label="Mobile">
          <ul className="grid grid-cols-2 gap-1">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm ${
                      isActive ? 'bg-primary-soft font-medium text-primary' : 'text-slate-600'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link
            to={isAuthenticated ? (role === 'MEMBER' ? '/portal' : '/admin') : '/login'}
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-white"
          >
            {isAuthenticated ? 'Open dashboard' : 'Sign in'}
          </Link>
        </nav>
      )}

      <span className="sr-only">{ORGANIZATION_NAME}</span>
    </header>
  );
}

export default PublicHeader;
