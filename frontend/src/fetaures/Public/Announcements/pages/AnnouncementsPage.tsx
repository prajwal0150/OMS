import { useState } from 'react';
import { format } from 'date-fns';
import { Megaphone } from 'lucide-react';
import { Badge, Card } from '../../../../components/ui';
import { humanize } from '../../../../types';
import {
  PublicPageHeader,
  PublicPagination,
  PublicState,
  PublicToolbar,
} from '../../Layouts/components/publicSections';
import { usePublicList } from '../../hooks/usePublicData';
import { fetchAnnouncementsPublic } from '../../services/publicService';

export function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const list = usePublicList(fetchAnnouncementsPublic, { page, limit: 12 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PublicPageHeader
        eyebrow="Stay informed"
        title="Announcements"
        description="Official notices from the district, our units and communities."
      />

      <PublicToolbar search={list.search} onSearchChange={list.setSearch} searchPlaceholder="Search announcements..." />

      <PublicState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        onRetry={list.refresh}
        emptyTitle="No announcements"
        emptyDescription="Notices published by the district will appear here."
        skeletonCount={4}
      >
        <div className="space-y-2">
          {list.items.map((announcement) => (
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
      </PublicState>

      <PublicPagination meta={list.pagination} onPageChange={setPage} itemLabel="announcements" />
    </div>
  );
}

export default AnnouncementsPage;
