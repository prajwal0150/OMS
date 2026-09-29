import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '../../../../components/ui';
import { MemberToolbar } from '../../components/MemberToolbar';
import { usePortalList } from '../../hooks/usePortalData';
import { fetchMyContent } from '../../services/memberPortalService';
import { humanize, refName, type ContentRecord } from '../../../../types';

/** Content the member may read, honouring visibility rules on the server. */
export function MemberContentPage() {
  const { items, pagination, loading, error, setPage, search, setSearch, refresh } =
    usePortalList<ContentRecord>(fetchMyContent);

  return (
    <div>
      <MemberToolbar
        title="Content"
        description="News, updates, stories and awareness material available to you."
        search={search}
        onSearchChange={setSearch}
      />

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="Nothing to read yet"
            description="Published content available to your unit and community will appear here."
            icon={<FileText className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item._id}
              to={`/content/${item.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-colors hover:border-primary/40"
            >
              {item.coverImage ? (
                <img src={item.coverImage} alt="" loading="lazy" className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center bg-slate-50 text-slate-300">
                  <FileText className="h-7 w-7" aria-hidden />
                </div>
              )}
              <div className="flex flex-1 flex-col p-3">
                <Badge tone="primary">{humanize(item.contentType)}</Badge>
                <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold text-secondary group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted">{item.summary}</p>
                <p className="mt-2 text-xs text-muted">
                  {refName(item.unit) ?? refName(item.district) ?? 'Sunsari'}
                  {item.publishedAt
                    ? ` - ${format(new Date(item.publishedAt), 'MMM d, yyyy')}`
                    : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination meta={pagination?.pagination} onPageChange={setPage} itemLabel="articles" />
    </div>
  );
}

export default MemberContentPage;
