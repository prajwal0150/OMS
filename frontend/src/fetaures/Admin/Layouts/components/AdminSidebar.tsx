import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import { visibleSections } from '../config/navigation';
import { sectionsForRole } from '../config/panelNavigation';
import { Button } from '../../../../components/ui';

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/** Compact sidebar: `px-3 py-2 text-sm` items, `rounded-lg` active state. */
export function AdminSidebar({ open, onClose }: SidebarProps) {
  const { permissions, role, logout } = useAuthState();
  const location = useLocation();
  const sections = visibleSections(sectionsForRole(role), { permissions, role });

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col overflow-hidden border-r border-line bg-white transition-transform lg:static lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-secondary">HEAVENLY PATH</p>
            <p className="truncate text-xs text-muted">Sunsari District</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {/*
          min-h-0 is what lets this nav actually scroll instead of stretching
          the <aside>: a flex child defaults to min-height:auto, so it refuses to
          shrink below its content and the sidebar would grow with the menu.
        */}
        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-2">
          {sections.map((section, sectionIndex) => (
            <div key={section.heading ?? `section-${sectionIndex}`}>
              {section.heading && (
                <p className="px-3 pt-1 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {section.heading}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? 'bg-primary-soft font-medium text-primary'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-2">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
