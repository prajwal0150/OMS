import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ChevronRight,
  ClipboardList,
  Download,
  Megaphone,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '../../../../components';
import type { Announcement } from '../../../../types';
import { PanelHeader } from './PanelHeader';

interface AccessLink {
  title: string;
  desc: string;
  to: string;
  icon: LucideIcon;
  tile: string;
}

const ACCESS_LINKS: AccessLink[] = [
  {
    title: 'Member Login',
    desc: 'Access your member portal',
    to: '/login',
    icon: UserRound,
    tile: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Admin Login',
    desc: 'For authorized administrators',
    to: '/login',
    icon: ShieldCheck,
    tile: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'View Reports',
    desc: 'Explore organization reports',
    to: '/district',
    icon: ClipboardList,
    tile: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Download Documents',
    desc: 'Important files and resources',
    to: '/activities',
    icon: Download,
    tile: 'bg-orange-50 text-orange-500',
  },
];

/** "Quick Access" panel: shortcuts to login, reports and documents. */
export function QuickAccessPanel() {
  return (
    <section className="rounded-lg border border-line bg-white shadow-sm">
      <PanelHeader icon={<UsersRound className="h-[18px] w-[18px]" />} title="Quick Access" />
      <div className="space-y-2.5 p-4">
        {ACCESS_LINKS.map((link) => (
          <Link
            key={link.title}
            to={link.to}
            className="group flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${link.tile}`}
            >
              <link.icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-secondary group-hover:text-primary">
                {link.title}
              </span>
              <span className="block truncate text-[11px] text-muted">{link.desc}</span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

export interface AnnouncementsPanelProps {
  items: Announcement[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** "Latest Announcements" panel: compact dated list with coloured dots. */
export function AnnouncementsPanel({ items, loading, error, onRetry }: AnnouncementsPanelProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <PanelHeader
        icon={<Megaphone className="h-[18px] w-[18px] text-warning" />}
        title="Latest Announcements"
        viewAllTo="/announcements"
      />
      {error ? (
        <div className="p-4">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="space-y-3 px-4 py-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="mt-1 h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="Notices published by the district will appear here."
          icon={<Megaphone className="h-5 w-5" />}
        />
      ) : (
        <ul>
          {items.map((announcement, index) => {
            const date = announcement.publishDate
              ? new Date(announcement.publishDate)
              : null;
            return (
              <li key={announcement._id} className="border-b border-line last:border-b-0">
                <Link
                  to="/announcements"
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-primary' : 'bg-warning'}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-secondary group-hover:text-primary">
                      {announcement.title}
                    </span>
                    {date && (
                      <span className="block text-[11px] text-muted">
                        {format(date, 'MMM d, yyyy')}
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
