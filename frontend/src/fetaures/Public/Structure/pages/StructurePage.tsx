import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Network, UsersRound } from 'lucide-react';
import { Badge, Card } from '../../../../components/ui';
import { humanize } from '../../../../types';
import {
  PublicPageHeader,
  PublicPagination,
  PublicSectionHeading,
  PublicState,
  PublicToolbar,
} from '../../Layouts/components/publicSections';
import { usePublicList } from '../../hooks/usePublicData';
import { fetchCommunitiesPublic, fetchUnitsPublic } from '../../services/publicService';

/**
 * Public "Structure" page.
 *
 * Merge of the former standalone Units and Communities pages, so one header
 * link covers both. They stay as two titled sections rather than a single
 * interleaved grid, because units and communities are separate server-side
 * collections with their own pagination and totals.
 *
 * A single search box drives both feeds, matching the Activities page.
 */
export function StructurePage() {
  // Deep link support: the global header search lands on /structure?search=...
  const [params] = useSearchParams();
  const urlSearch = params.get('search') ?? '';

  const [unitsPage, setUnitsPage] = useState(1);
  const [communitiesPage, setCommunitiesPage] = useState(1);

  const units = usePublicList(fetchUnitsPublic, { page: unitsPage, limit: 12 });
  const communities = usePublicList(fetchCommunitiesPublic, {
    page: communitiesPage,
    limit: 12,
  });

  // Push the URL query into both feeds on arrival and on back-navigation.
  useEffect(() => {
    units.setSearch(urlSearch);
    communities.setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  /** One search box, both feeds. `setSearch` also resets each feed to page 1. */
  const handleSearch = (value: string) => {
    units.setSearch(value);
    communities.setSearch(value);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PublicPageHeader
        eyebrow="Organization"
        title="Our Structure"
        description="The units that deliver programs across the district, and the communities that organize members around shared interests."
      />

      <PublicToolbar
        search={units.search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search units and communities..."
      />

      {/* --- Units ----------------------------------------------------------- */}
      <section className="mb-8">
        <PublicSectionHeading
          icon={<Network className="h-4 w-4" aria-hidden />}
          title="Units"
          total={units.pagination?.pagination?.total}
        />

        <PublicState
          loading={units.loading}
          error={units.error}
          isEmpty={units.items.length === 0}
          onRetry={units.refresh}
          emptyTitle="No units yet"
          emptyDescription="Check back soon - new units are published regularly."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {units.items.map((item) => (
              <Card key={item._id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Network className="h-4 w-4" aria-hidden />
                  </div>
                  <Badge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                    {humanize(item.status)}
                  </Badge>
                </div>
                <h3 className="mt-2 text-base font-semibold text-secondary">{item.name}</h3>
                <p className="text-xs text-muted">{item.code}</p>
                {item.location && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {item.location}
                  </p>
                )}
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </PublicState>

        <PublicPagination
          meta={units.pagination}
          onPageChange={setUnitsPage}
          itemLabel="units"
        />
      </section>

      {/* --- Communities ----------------------------------------------------- */}
      <section>
        <PublicSectionHeading
          icon={<UsersRound className="h-4 w-4" aria-hidden />}
          title="Communities"
          total={communities.pagination?.pagination?.total}
        />

        <PublicState
          loading={communities.loading}
          error={communities.error}
          isEmpty={communities.items.length === 0}
          onRetry={communities.refresh}
          emptyTitle="No communities yet"
          emptyDescription="Check back soon - new communities are published regularly."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {communities.items.map((item) => (
              <Card key={item._id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <UsersRound className="h-4 w-4" aria-hidden />
                  </div>
                  <Badge tone="purple">{humanize(item.targetGroup)}</Badge>
                </div>
                <h3 className="mt-2 text-base font-semibold text-secondary">{item.name}</h3>
                <p className="text-xs text-muted">
                  {item.code}
                  {item.ageGroup ? ` - ${item.ageGroup}` : ''}
                </p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </PublicState>

        <PublicPagination
          meta={communities.pagination}
          onPageChange={setCommunitiesPage}
          itemLabel="communities"
        />
      </section>
    </div>
  );
}

export default StructurePage;
