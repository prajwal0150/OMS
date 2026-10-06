import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, Megaphone } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '../../../../components';
import { Reveal, Stagger, StaggerItem } from './motion';
import { StoryHeading } from './motionExtras';
import type { Announcement } from '../../../../types';
import { resolveAssetUrl } from '../../../../services/api/httpClient';

export function AnnouncementsStory({ items, loading, error, onRetry }: { items: Announcement[]; loading: boolean; error: string | null; onRetry: () => void }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <div className="overflow-hidden rounded-lg border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-white p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <StoryHeading eyebrow="Please note" title="Important announcements" description="Only current notices — not an archive dump." />
          <Reveal delay={0.1}>
            <Link to="/announcements" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              All announcements <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Reveal>
        </div>
        <div className="mt-4">
          {error ? <ErrorState message={error} onRetry={onRetry} /> : loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => (<div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3"><Skeleton className="h-8 w-8 rounded-lg" /><div className="flex-1"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="mt-1 h-3 w-1/3" /></div></div>))}</div>
          ) : items.length === 0 ? (
            <EmptyState title="No current announcements" description="Official notices will appear here when published." icon={<Megaphone className="h-5 w-5" />} />
          ) : (
            <Stagger className="grid gap-2.5 sm:grid-cols-2" stagger={0.08}>
              {items.slice(0, 4).map((a) => (
                <StaggerItem key={a._id}>
                  <Link to="/announcements" className="group flex items-start gap-3 rounded-lg border border-line bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                    {a.image ? (<img src={resolveAssetUrl(a.image)} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg object-cover" />) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Megaphone className="h-4 w-4" aria-hidden /></span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-secondary group-hover:text-primary">{a.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{a.content}</span>
                      <span className="mt-1 block text-[11px] text-muted">{format(new Date(a.publishDate), 'MMM d, yyyy')}</span>
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </section>
  );
}
export default AnnouncementsStory;
