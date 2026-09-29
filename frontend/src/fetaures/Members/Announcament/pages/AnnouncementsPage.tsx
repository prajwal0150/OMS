import { format } from 'date-fns';
import { Megaphone } from 'lucide-react';
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
import { fetchMyAnnouncements } from '../../services/memberPortalService';
import { humanize, type Announcement } from '../../../../types';

/** Announcements addressed to the member's district, unit or community. */
export function MemberAnnouncementsPage() {
  const { items, pagination, loading, error, setPage, search, setSearch, refresh } =
    usePortalList<Announcement>(fetchMyAnnouncements);

  return (
    <div>
      <MemberToolbar
        title="Announcements"
        description="Notices issued for your district, unit or community."
        search={search}
        onSearchChange={setSearch}
      />

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No announcements"
            description="You have no pending notices right now."
            icon={<Megaphone className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((announcement) => (
            <Card key={announcement._id}>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-warning">
                  <Megaphone className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-secondary">{announcement.title}</h3>
                    <Badge tone="neutral">{humanize(announcement.targetType)}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-slate-700">
                    {announcement.content}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Published {format(new Date(announcement.publishDate), 'MMMM d, yyyy')}
                    {announcement.expiryDate
                      ? ` - Expires ${format(new Date(announcement.expiryDate), 'MMM d, yyyy')}`
                      : ''}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination meta={pagination?.pagination} onPageChange={setPage} itemLabel="announcements" />
    </div>
  );
}

export default MemberAnnouncementsPage;
