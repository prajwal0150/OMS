import type { ReactNode } from 'react';
import { Card, EmptyState, ErrorState, Pagination, Skeleton } from '../../../../../components/ui';

const YOUTUBE = new RegExp('(?:youtube\\\\.com/watch\\\\?v=|youtu\\\\.be/)([\\\\w-]{6,})');
const VIMEO = new RegExp('vimeo\\\\.com/(\\\\d+)');

/** Converts a YouTube/Vimeo watch URL into its embeddable player URL. */
export const toEmbedUrl = (url: string): string | null => {
  const youtube = YOUTUBE.exec(url);
  if (youtube?.[1]) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = VIMEO.exec(url);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
};

export interface VideoEmbedProps {
  url: string;
  caption?: string;
}

/** Renders an embedded YouTube/Vimeo player, or a native `<video>` otherwise. */
export function VideoEmbed({ url, caption }: VideoEmbedProps) {
  const src = toEmbedUrl(url);
  return (
    <figure className="overflow-hidden rounded-lg border border-line">
      {src ? (
        <iframe
          src={src}
          title={caption ?? 'Embedded video'}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <video src={url} controls className="w-full" preload="metadata" />
      )}
      {caption && <figcaption className="px-3 py-1.5 text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}

export interface PublicPageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PublicPageHeader({ title, description, eyebrow, actions }: PublicPageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium tracking-widest text-primary uppercase">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-semibold text-secondary">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface PublicToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

/** Compact public search + filter row (debounced inside `usePublicList`). */
export function PublicToolbar({ search, onSearchChange, searchPlaceholder, children }: PublicToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder ?? 'Searchâ¬¦'}
        aria-label={searchPlaceholder ?? 'Search'}
        className="h-9 min-w-48 flex-1 rounded-lg border border-line bg-white px-3 text-sm shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
      />
      {children}
    </div>
  );
}

export interface PublicFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
  allLabel?: string;
}

export function PublicFilterSelect({ value, onChange, options, label, allLabel }: PublicFilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="h-9 cursor-pointer rounded-lg border border-line bg-white px-3 text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
    >
      <option value="">{allLabel ?? `All ${label.toLowerCase()}`}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export interface PublicStateProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonCount?: number;
  children: ReactNode;
}

/** Uniform loading / error / empty handling for every public list. */
export function PublicState({
  loading,
  error,
  isEmpty,
  onRetry,
  emptyTitle = 'Nothing to show yet',
  emptyDescription,
  skeletonCount = 6,
  children,
}: PublicStateProps) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="mt-2 h-3.5 w-2/3" />
            <Skeleton className="mt-1.5 h-3 w-full" />
          </Card>
        ))}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <Card padding="none">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Card>
    );
  }
  return <>{children}</>;
}

export function PublicPagination({
  meta,
  onPageChange,
  itemLabel = 'items',
}: {
  meta?: { pagination?: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } };
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  if (!meta?.pagination || meta.pagination.totalPages <= 1) return null;
  return <Pagination meta={meta.pagination} onPageChange={onPageChange} itemLabel={itemLabel} />;
}
