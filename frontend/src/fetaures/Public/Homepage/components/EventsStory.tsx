import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Badge, EmptyState, ErrorState, Skeleton } from '../../../../components';
import { humanize, refName, type EventRecord } from '../../../../types';
import { Reveal, Stagger, StaggerItem } from './motion';
import { MotionCard, StoryHeading } from './motionExtras';

export function EventsStory({ items, loading, error, onRetry }: { items: EventRecord[]; loading: boolean; error: string | null; onRetry: () => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = items.filter((e) => new Date(e.startDate) >= today).slice(0, 4);
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <StoryHeading eyebrow="Mark your calendar" title="Upcoming events" description="Real gatherings published by the district, units and communities." />
        <Reveal delay={0.1}>
          <Link to="/activities" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            All activities <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Reveal>
      </div>
      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={onRetry} /> : loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-line bg-white p-3">
                <Skeleton className="h-14 w-14 rounded-lg" />
                <div className="flex-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="mt-2 h-3 w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState title="No upcoming events" description="Events published by the district will appear here." icon={<CalendarDays className="h-5 w-5" />} />
        ) : (
          <Stagger className="grid gap-3 sm:grid-cols-2" stagger={0.12}>
            {upcoming.map((event) => {
              const date = new Date(event.startDate);
              const place = event.location ?? refName(event.unit) ?? refName(event.district) ?? 'Sunsari';
              return (
                <StaggerItem key={event._id}>
                  <MotionCard className="rounded-lg border border-line bg-white shadow-sm">
                    <Link to="/activities" className="group flex items-center gap-3 p-3">
                      <span className="w-14 shrink-0 rounded-lg bg-primary-soft px-1 py-2 text-center">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-primary/80">{format(date, 'MMM')}</span>
                        <span className="mt-0.5 block text-xl leading-none font-bold text-primary">{format(date, 'dd')}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-secondary group-hover:text-primary">{event.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                          <span className="truncate">{place}{event.startTime ? ` · ${event.startTime}` : ''}</span>
                        </span>
                        {event.organizer && <span className="mt-0.5 block truncate text-[11px] text-muted">by {event.organizer}</span>}
                      </span>
                      <Badge tone="success">{humanize(event.level)}</Badge>
                    </Link>
                  </MotionCard>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </section>
  );
}
export default EventsStory;
