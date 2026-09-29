import { useState } from 'react';
import { Card } from '../../../../components/ui';
import { Badge } from '../../../../components/ui';
import { MapPin, Network } from 'lucide-react';
import { humanize } from '../../../../types';
import {
  PublicPageHeader,
  PublicPagination,
  PublicState,
  PublicToolbar,
} from '../../Layouts/components/publicSections';
import { usePublicList } from '../../hooks/usePublicData';
import { fetchUnitsPublic } from '../../services/publicService';

export function UnitsPage() {
  const [page, setPage] = useState(1);
  const list = usePublicList(fetchUnitsPublic, { page, limit: 12 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PublicPageHeader eyebrow="Organization" title="Our units" description="Four operational units deliver programs across the Sunsari district." />

      <PublicToolbar search={list.search} onSearchChange={list.setSearch} searchPlaceholder="Search units⬦" />

      <PublicState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        onRetry={list.refresh}
        emptyTitle="Nothing published yet"
        emptyDescription="Check back soon - new units are published regularly."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.items.map((item) => (
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

      <PublicPagination meta={list.pagination} onPageChange={setPage} itemLabel="units" />
    </div>
  );
}

export default UnitsPage;
