import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarDays, Clock, FileText, MapPin, Newspaper } from 'lucide-react';
import { Badge, Card } from '../../../../components/ui';
import { CONTENT_TYPE, humanize, refName } from '../../../../types';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import {
  PublicFilterSelect,
  PublicPageHeader,
  PublicPagination,
  PublicSectionHeading,
  PublicState,
  PublicToolbar,
} from '../../Layouts/components/publicSections';
import { usePublicList } from '../../hooks/usePublicData';
import { fetchContentPublic, fetchEventsPublic } from '../../services/publicService';

const TYPE_OPTIONS = Object.values(CONTENT_TYPE).map((value) => ({
  value,
  label: humanize(value),
}));

/**
 * Public "Activities" page.
 *
 * This is the merge of the former standalone Events and Content list pages: a
 * visitor now reaches both from a single header link. The two feeds stay as
 * separate, clearly titled sections rather than one interleaved list, because
 * events and articles paginate independently on the server and merging them
 * into a single feed would break "load more" and the per-section totals.
 *
 * A single search box drives both feeds, so the global header search
 * (`/activities?search=...`) filters events and stories at the same time.
 */
export function ActivitiesPage() {
  // Deep link support: the global header search lands on /activities?search=...
  const [params] = useSearchParams();
  const urlSearch = params.get('search') ?? '';

  const [eventsPage, setEventsPage] = useState(1);
  const [storiesPage, setStoriesPage] = useState(1);

  const events = usePublicList(fetchEventsPublic, { page: eventsPage, limit: 6 });
  const stories = usePublicList(fetchContentPublic, { page: storiesPage, limit: 6 });

  // Push the URL query into both feeds on arrival and on back-navigation.
  useEffect(() => {
    events.setSearch(urlSearch);
    stories.setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  /** One search box, both feeds. `setSearch` also resets each feed to page 1. */
  const handleSearch = (value: string) => {
    events.setSearch(value);
    stories.setSearch(value);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PublicPageHeader
        eyebrow="What we do"
        title="Activities"
        description="Everything happening across the district in one place: meetings, training, awareness programs, community events, social service, stories and achievements."
      />

      <PublicToolbar
        search={events.search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search events and stories..."
      />

      {/* --- Events ---------------------------------------------------------- */}
      <section className="mb-8">
        <PublicSectionHeading
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          title="Events"
          total={events.pagination?.pagination?.total}
        />

        <PublicState
          loading={events.loading}
          error={events.error}
          isEmpty={events.items.length === 0}
          onRetry={events.refresh}
          emptyTitle="No events scheduled"
          emptyDescription="Upcoming events will appear here as they are published."
        >
          <div className="space-y-2">
            {events.items.map((event) => (
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
                        {event.startTime}
                        {event.endTime ? ` - ${event.endTime}` : ''}
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

        <PublicPagination
          meta={events.pagination}
          onPageChange={setEventsPage}
          itemLabel="events"
        />
      </section>

      {/* --- Stories & updates ------------------------------------------------ */}
      <section>
        <PublicSectionHeading
          icon={<Newspaper className="h-4 w-4" aria-hidden />}
          title="Stories & Updates"
          total={stories.pagination?.pagination?.total}
        />

        <div className="mb-4">
          <PublicFilterSelect
            value={stories.filters.contentType ?? ''}
            onChange={(value) => stories.setFilter('contentType', value)}
            options={TYPE_OPTIONS}
            label="Type"
          />
        </div>

        <PublicState
          loading={stories.loading}
          error={stories.error}
          isEmpty={stories.items.length === 0}
          onRetry={stories.refresh}
          emptyTitle="No articles published yet"
          emptyDescription="Published stories and updates will appear here."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stories.items.map((item) => (
              <Link
                key={item._id}
                to={`/content/${item.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-colors hover:border-primary/40"
              >
                {item.coverImage ? (
                  <img
                    src={resolveAssetUrl(item.coverImage)}
                    alt=""
                    loading="lazy"
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-slate-50 text-slate-300">
                    <FileText className="h-8 w-8" aria-hidden />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-3">
                  <Badge tone="primary">{humanize(item.contentType)}</Badge>
                  <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold text-secondary group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 flex-1 text-xs text-muted">{item.summary}</p>
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
        </PublicState>

        <PublicPagination
          meta={stories.pagination}
          onPageChange={setStoriesPage}
          itemLabel="articles"
        />
      </section>
    </div>
  );
}

export default ActivitiesPage;
