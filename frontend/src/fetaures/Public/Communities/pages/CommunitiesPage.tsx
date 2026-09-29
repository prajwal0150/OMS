import { useState } from 'react';
import { Card } from '../../../../components/ui';
import { Badge } from '../../../../components/ui';
import { UsersRound } from 'lucide-react';
import { humanize } from '../../../../types';
import {
  PublicPageHeader,
  PublicPagination,
  PublicState,
  PublicToolbar,
} from '../../Layouts/components/publicSections';
import { usePublicList } from '../../hooks/usePublicData';
import { fetchCommunitiesPublic } from '../../services/publicService';

export function CommunitiesPage() {
  const [page, setPage] = useState(1);
  const list = usePublicList(fetchCommunitiesPublic, { page, limit: 12 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PublicPageHeader eyebrow="Organization" title="Our communities" description="Parents, Women and Youth communities organize members around shared interests." />

      <PublicToolbar search={list.search} onSearchChange={list.setSearch} searchPlaceholder="Search communities⬦" />

      <PublicState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        onRetry={list.refresh}
        emptyTitle="Nothing published yet"
        emptyDescription="Check back soon - new communities are published regularly."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.items.map((item) => (
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

      <PublicPagination meta={list.pagination} onPageChange={setPage} itemLabel="communities" />
    </div>
  );
}

export default CommunitiesPage;
