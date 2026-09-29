import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { ResourceListPage } from '../../../../components';
import { Badge, Button, statusTone } from '../../../../components/ui';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../hooks/useScopeOptions';
import { useContent } from '../hooks/useContent';
import { fetchContentList } from '../redux/contentThunk';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import {
  CONTENT_STATUS,
  CONTENT_TYPE,
  ENUM_LABELS,
  humanize,
  refName,
  type ContentRecord,
} from '../../../../types';
import { format } from 'date-fns';

/** Content authoring: drafts move through review, approval and publishing. */
export function ContentAdminPage() {
  const navigate = useNavigate();
  const { can } = useAuthState();
  const { items, pagination, loading, error } = useContent();
  const { units, communities } = useScopeOptions();
  const [view, setView] = useState<'all' | 'mine'>('all');

  return (
    <ResourceListPage<ContentRecord>
      title="Content"
      description="News, district and unit updates, community stories and awareness material."
      fetchList={fetchContentList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      itemLabel="articles"
      onRowClick={(row) => navigate(`/admin/content/${row._id}/preview`)}
      emptyTitle="No content yet"
      emptyDescription="Create your first article to get started."
      primaryAction={{
        label: 'New content',
        hidden: !can('content.create'),
        onClick: () => navigate('/admin/content/new'),
      }}
      secondaryActions={
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setView('all')}
            aria-pressed={view === 'all'}
          >
            All
          </Button>
          {can('content.approve') && (
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/content/review')}>
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Review queue
            </Button>
          )}
        </>
      }
      columns={[
        {
          key: 'title',
          header: 'Title',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.title}</p>
              <p className="truncate text-xs text-muted">{row.summary ?? ''}</p>
            </div>
          ),
        },
        {
          key: 'contentType',
          header: 'Type',
          sortable: true,
          render: (row) => <Badge tone="primary">{humanize(row.contentType)}</Badge>,
        },
        {
          key: 'scope',
          header: 'Scope',
          priority: false,
          render: (row) =>
            [refName(row.unit), refName(row.community)].filter(Boolean).join(' / ') ||
            refName(row.district) ||
            '—',
        },
        {
          key: 'publishedAt',
          header: 'Published',
          priority: false,
          sortable: true,
          render: (row) =>
            row.publishedAt ? format(new Date(row.publishedAt), 'MMM d, yyyy') : '—',
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          render: (row) => (
            <Badge tone={statusTone(row.status)} dot>
              {humanize(row.status)}
            </Badge>
          ),
        },
      ]}
      filters={[
        {
          name: 'status',
          label: 'Status',
          value: '',
          options: enumOptions(Object.values(CONTENT_STATUS), ENUM_LABELS),
        },
        {
          name: 'contentType',
          label: 'Type',
          value: '',
          options: enumOptions(Object.values(CONTENT_TYPE), ENUM_LABELS),
        },
        {
          name: 'unit',
          label: 'Unit',
          value: '',
          options: toFilterOptions(units),
        },
        {
          name: 'community',
          label: 'Community',
          value: '',
          options: toFilterOptions(communities),
        },
      ]}
    />
  );
}

export default ContentAdminPage;
