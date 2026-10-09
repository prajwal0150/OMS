import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarDays, FileText } from 'lucide-react';
import { Badge } from '../../../../components/ui';
import { CONTENT_TYPE, humanize, refName } from '../../../../types';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import {
  PublicPageHeader,
  PublicPagination,
  PublicSectionHeading,
  PublicState,
  PublicToolbar,
} from '../../Layouts/components/publicSections';
import { usePublicList } from '../../hooks/usePublicData';
import { fetchContentPublic } from '../../services/publicService';
import { Stagger, StaggerItem } from '../../Layouts/components/PublicMotion';

/**
 * Public "Activities" page.
 *
 * This page lists only the activity posts that administrators publish from the
 * admin content feed (content type `ACTIVITY`). Events and other content types
 * are intentionally excluded here; the feed is locked to activities so a
 * published activity appears here as soon as it is live for the public.
 *
 * The global header search (`/activities?search=...`) filters this single feed.
 */
export function ActivitiesPage() {
  // Deep link support: the global header search lands on /activities?search=...
  const [params] = useSearchParams();
  const urlSearch = params.get('search') ?? '';

  const [activitiesPage, setActivitiesPage] = useState(1);

  const activities = usePublicList(fetchContentPublic, {
    page: activitiesPage,
    limit: 6,
    initialFilters: { contentType: CONTENT_TYPE.ACTIVITY },
  });

  // Push the URL query into the feed on arrival and on back-navigation.
  useEffect(() => {
    activities.setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PublicPageHeader
        eyebrow="What we do"
        title="Activities"
        description="Activities published by the district across our units and communities."
      />

      <PublicToolbar
        search={activities.search}
        onSearchChange={activities.setSearch}
        searchPlaceholder="Search activities..."
      />

      {/* --- Activities (published by admins, content type ACTIVITY) --------- */}
      <section>
        <PublicSectionHeading
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          title="Activities"
          total={activities.pagination?.pagination?.total}
        />

        <PublicState
          loading={activities.loading}
          error={activities.error}
          isEmpty={activities.items.length === 0}
          onRetry={activities.refresh}
          emptyTitle="No activities published yet"
          emptyDescription="Activities published by the administrators will appear here."
        >
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {activities.items.map((item) => (
              <StaggerItem key={item._id}>
                <Link
                  to={`/content/${item.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-colors hover:border-primary/40"
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
              </StaggerItem>
            ))}
          </Stagger>
        </PublicState>

        <PublicPagination
          meta={activities.pagination}
          onPageChange={setActivitiesPage}
          itemLabel="activities"
        />
      </section>
    </div>
  );
}

export default ActivitiesPage;
