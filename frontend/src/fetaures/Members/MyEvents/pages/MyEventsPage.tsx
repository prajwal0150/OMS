import { format } from 'date-fns';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  statusTone,
} from '../../../../components/ui';
import { MemberToolbar } from '../../components/MemberToolbar';
import { usePortalList } from '../../hooks/usePortalData';
import { fetchMyEvents } from '../../services/memberPortalService';
import { humanize, type EventRecord } from '../../../../types';

export function MyEventsPage() {
  const { items, pagination, loading, error, setPage, search, setSearch, refresh } =
    usePortalList<EventRecord>(fetchMyEvents);

  return (
    <div>
      <MemberToolbar
        title="My events"
        description="Events you can attend, open to your community or scheduled for your unit."
        search={search}
        onSearchChange={setSearch}
      />

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No events yet"
            description="Events relevant to your unit and community will appear here."
            icon={<CalendarDays className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((event) => (
            <Card key={event._id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex w-14 shrink-0 items-center justify-center rounded-lg bg-primary p-2 text-center text-white">
                <div>
                  <p className="text-lg leading-none font-semibold">
                    {format(new Date(event.startDate), 'dd')}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase">
                    {format(new Date(event.startDate), 'MMM')}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-secondary">{event.title}</h3>
                  <Badge tone="primary">{humanize(event.type)}</Badge>
                  <Badge tone={statusTone(event.status)}>{humanize(event.status)}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{event.description}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" aria-hidden />
                    {format(new Date(event.startDate), 'MMMM d, yyyy')}
                  </span>
                  {event.startTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden />
                      {event.startTime}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination meta={pagination?.pagination} onPageChange={setPage} itemLabel="events" />
    </div>
  );
}

export default MyEventsPage;
