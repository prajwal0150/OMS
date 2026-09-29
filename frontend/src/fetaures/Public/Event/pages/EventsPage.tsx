import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { Badge, Card } from '../../../../components/ui';
import { humanize } from '../../../../types';
import {
  PublicPageHeader,
  PublicPagination,
  PublicState,
  PublicToolbar,
} from '../../Layouts/components/publicSections';
import { usePublicList } from '../../hooks/usePublicData';
import { fetchEventsPublic } from '../../services/publicService';

export function EventsPage() {
  const [page, setPage] = useState(1);
  const list = usePublicList(fetchEventsPublic, { page, limit: 12 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <PublicPageHeader
        eyebrow="What we do"
        title="Events"
        description="Meetings, training, awareness programs, community events and social service across the district."
      />

      <PublicToolbar search={list.search} onSearchChange={list.setSearch} searchPlaceholder="Search events..." />

      <PublicState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        onRetry={list.refresh}
        emptyTitle="No events scheduled"
        emptyDescription="Upcoming events will appear here as they are published."
      >
        <div className="space-y-2">
          {list.items.map((event) => (
            <Card key={event._id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex w-14 shrink-0 items-center justify-center rounded-lg bg-primary p-2 text-center text-white">
                <div>
                  <p className="text-lg leading-none font-semibold">
                    {format(new Date(event.startDate), 'dd')}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase">{format(new Date(event.startDate), 'MMM')}</p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-secondary">{event.title}</h3>
                  <Badge tone="primary">{humanize(event.type)}</Badge>
                  <Badge tone={event.status === 'SCHEDULED' ? 'info' : 'neutral'}>
                    {humanize(event.status)}
                  </Badge>
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
                      {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
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
      </PublicState>

      <PublicPagination meta={list.pagination} onPageChange={setPage} itemLabel="events" />
    </div>
  );
}

export default EventsPage;
