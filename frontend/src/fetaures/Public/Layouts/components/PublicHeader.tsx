import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, UserRound, X } from 'lucide-react';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import {
  DEFAULT_DISTRICT_NAME,
  ORGANIZATION_NAME,
  ORGANIZATION_SHORT_NAME,
} from '../../../../constants';
import { OrganizationLogo } from './OrganizationLogo';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'District', to: '/district' },
  { label: 'Units', to: '/units' },
  { label: 'Communities', to: '/communities' },
  { label: 'Events', to: '/events' },
  { label: 'Content', to: '/content' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' },
];

/** Responsive public header: logo, primary nav, search box and the login button. */
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthState();

  /** The mockup's search box routes into the public content list. */
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/content?search=${encodeURIComponent(trimmed)}` : '/content');
  };

  const dashboardTo = isAuthenticated ? (role === 'MEMBER' ? '/portal' : '/admin') : '/login';

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <OrganizationLogo className="h-9 w-9" />
          <span className="min-w-0">
            <span className="block text-[15px] leading-tight font-bold tracking-tight text-secondary">
              {ORGANIZATION_SHORT_NAME}
            </span>
            <span className="block text-[10px] leading-tight font-semibold tracking-wide text-muted">
              {DEFAULT_DISTRICT_NAME.toUpperCase()} DISTRICT
            </span>
          </span>
        </Link>

        <nav className="ml-3 hidden h-14 items-stretch xl:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center border-b-2 px-3 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-600 hover:text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <form onSubmit={submitSearch} className="relative hidden xl:block" role="search">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              aria-label="Search the website"
              className="h-9 w-44 rounded-lg border border-line bg-slate-50 pr-3 pl-8 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 focus:outline-none"
            />
          </form>

          <Link
            to={dashboardTo}
            className="hidden h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-primary-hover sm:inline-flex"
          >
            <UserRound className="h-3.5 w-3.5" aria-hidden />
            {isAuthenticated ? 'Dashboard' : 'Login'}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 xl:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <Menu className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white p-2 xl:hidden" aria-label="Mobile">
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
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
          <form onSubmit={submitSearch} className="relative mt-2" role="search">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              aria-label="Search the website"
              className="h-9 w-full rounded-lg border border-line bg-slate-50 pr-3 pl-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none"
            />
          </form>
          <Link
            to={dashboardTo}
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
          >
            <UserRound className="h-3.5 w-3.5" aria-hidden />
            {isAuthenticated ? 'Dashboard' : 'Login'}
          </Link>
        </nav>
      )}

      <span className="sr-only">{ORGANIZATION_NAME}</span>
    </header>
  );
}

export default PublicHeader;
