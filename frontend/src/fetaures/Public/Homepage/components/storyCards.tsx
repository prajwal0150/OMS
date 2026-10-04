import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarDays, Newspaper } from 'lucide-react';
import { Badge, EmptyState, ErrorState, Skeleton, type BadgeTone } from '../../../../components';
import { label, type ContentRecord } from '../../../../types';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import { Reveal, Stagger, StaggerItem } from './motion';
import { StoryHeading } from './motionExtras';

export const toneFor = (contentType?: string): BadgeTone => {
  switch (contentType) {
    case 'COMMUNITY_STORY':
      return 'success';
    case 'EVENT_STORY':
      return 'purple';
    case 'NEWS':
      return 'info';
    default:
      return 'primary';
  }
};

export const badgeText = (contentType?: string): string => label(contentType).replace(/ Story$/, '');

export const excerptOf = (item: ContentRecord): string => {
  if (item.summary) return item.summary;
  return item.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 170);
};

export function StoryMeta({ item }: { item: ContentRecord }) {
  const date = item.publishedAt ?? item.createdAt;
  if (!date) return null;
  return (
    <span className="mt-1 flex items-center gap-1 text-[11px] text-muted">
      <CalendarDays className="h-3 w-3" aria-hidden />
      {format(new Date(date), 'MMM d, yyyy')}
    </span>
  );
}

export function StoryStates({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-1.5 h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <EmptyState
      title="No stories yet"
      description="Published stories from the district will appear here."
      icon={<Newspaper className="h-5 w-5" />}
    />
  );
}

export function StoryCard({ item }: { item: ContentRecord }) {
  return (
    <Link
      to={`/content/${item.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {item.coverImage ? (
        <img src={resolveAssetUrl(item.coverImage)} alt="" loading="lazy" className="h-36 w-full object-cover" />
      ) : (
        <span className="flex h-36 items-center justify-center bg-primary-soft">
          <Newspaper className="h-8 w-8 text-primary/40" aria-hidden />
        </span>
      )}
      <span className="flex flex-1 flex-col p-3">
        <Badge tone={toneFor(item.contentType)}>{badgeText(item.contentType)}</Badge>
        <span className="mt-1.5 line-clamp-2 text-sm font-semibold text-secondary group-hover:text-primary">{item.title}</span>
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{excerptOf(item)}</span>
        <StoryMeta item={item} />
      </span>
    </Link>
  );
}

export { Reveal, Stagger, StaggerItem, StoryHeading };
