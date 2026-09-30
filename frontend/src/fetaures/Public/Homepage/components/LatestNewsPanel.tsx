import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarDays, Newspaper } from 'lucide-react';
import {
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
  type BadgeTone,
} from '../../../../components';
import { label, type ContentRecord } from '../../../../types';
import { PanelHeader } from './PanelHeader';

/** Badge colour per content type (blue district update, green community, purple event). */
const toneFor = (contentType?: string): BadgeTone => {
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

/** "COMMUNITY_STORY" -> "Community" (matches the short pills in the design). */
const badgeText = (contentType?: string): string =>
  label(contentType).replace(/ Story$/, '');

const excerptOf = (item: ContentRecord): string => {
  if (item.summary) return item.summary;
  return item.content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 170);
};

const dateOf = (item: ContentRecord): Date | null => {
  const raw = item.publishedAt ?? item.createdAt;
  return raw ? new Date(raw) : null;
};

export interface LatestNewsPanelProps {
  items: ContentRecord[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** "Latest News" panel: three of the freshest published stories with cover images. */
export function LatestNewsPanel({ items, loading, error, onRetry }: LatestNewsPanelProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <PanelHeader
        icon={<Newspaper className="h-[18px] w-[18px]" />}
        title="Latest News"
        viewAllTo="/content"
      />
      <div className="p-4">
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-line">
                <Skeleton className="h-32 w-full rounded-none" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-1.5 h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No news published yet"
            description="Published stories and updates from the district will appear here."
            icon={<Newspaper className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((item) => {
              const date = dateOf(item);
              return (
                <Link
                  key={item._id}
                  to={`/content/${item.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-primary/40"
                >
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt=""
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-linear-to-br from-sky-100 via-blue-50 to-indigo-100">
                      <Newspaper className="h-8 w-8 text-sky-300" aria-hidden />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col px-3 pb-3">
                    <span className="relative z-10 -mt-2.5 self-start">
                      <Badge tone={toneFor(item.contentType)}>{badgeText(item.contentType)}</Badge>
                    </span>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-secondary group-hover:text-primary">
                      {item.title}
                    </h3>
                    {date && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
                        <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
                        {format(date, 'MMM d, yyyy')}
                      </p>
                    )}
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted">
                      {excerptOf(item)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default LatestNewsPanel;
