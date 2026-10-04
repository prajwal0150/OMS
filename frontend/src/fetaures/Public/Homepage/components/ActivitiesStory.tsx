import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Badge, EmptyState, ErrorState, Skeleton } from '../../../../components';
import { humanize, refName, type ContentRecord } from '../../../../types';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import { Reveal } from './motion';
import { StoryHeading } from './motionExtras';
import { badgeText, excerptOf, toneFor } from './storyCards';

/** Pinned visual storytelling: sticky image left, scrolling stories right. */
export function ActivitiesStory({ items, loading, error, onRetry }: { items: ContentRecord[]; loading: boolean; error: string | null; onRetry: () => void }) {
  if (error) return (<section className="mx-auto w-full max-w-7xl px-4 pt-10"><ErrorState message={error} onRetry={onRetry} /></section>);
  if (loading) return (<section className="mx-auto w-full max-w-7xl px-4 pt-10"><div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72 w-full rounded-lg" /><Skeleton className="h-72 w-full rounded-lg" /></div></section>);
  if (items.length === 0) return (<section className="mx-auto w-full max-w-7xl px-4 pt-10"><EmptyState title="No recent activities yet." description="Community programs and activities will appear here." icon={<CalendarDays className="h-5 w-5" />} /></section>);
  const first = items[0];
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <StoryHeading eyebrow="In the field" title="Recent activities" description="What our units and communities have been doing lately." />
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Reveal>
            <Link to={`/content/${first.slug}`} className="group relative block overflow-hidden rounded-lg border border-line shadow-sm">
              {first.coverImage ? (<img src={resolveAssetUrl(first.coverImage)} alt="" loading="lazy" className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-80" />) : (<div className="flex h-64 items-center justify-center bg-primary-soft sm:h-80"><CalendarDays className="h-10 w-10 text-primary/40" aria-hidden /></div>)}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-4 pt-10">
                <Badge tone={toneFor(first.contentType)}>{badgeText(first.contentType)}</Badge>
                <span className="mt-1.5 block text-base font-semibold text-white">{first.title}</span>
              </span>
            </Link>
          </Reveal>
        </div>
        <div className="space-y-3">
          {items.slice(0, 4).map((item, idx) => (
            <Reveal key={item._id} delay={Math.min(idx * 0.06, 0.2)}>
              <Link to={`/content/${item.slug}`} className="group flex gap-3 rounded-lg border border-line bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary">0{idx + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-secondary group-hover:text-primary">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">{excerptOf(item)}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
                    {(item.publishedAt ?? item.createdAt) && (<span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" aria-hidden />{format(new Date(item.publishedAt ?? item.createdAt!), 'MMM d, yyyy')}</span>)}
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{refName(item.unit) ?? refName(item.district) ?? 'Sunsari'}{item.community ? ` · ${refName(item.community)}` : ''}</span>
                    <span>{humanize(item.contentType)}</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 self-center text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
              </Link>
            </Reveal>
          ))}
          <Reveal>
            <Link to="/activities" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Explore all activities <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
export default ActivitiesStory;
