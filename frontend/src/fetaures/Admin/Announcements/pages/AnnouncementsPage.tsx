import { ResourceListPage } from '../../../../components';
import { Badge, statusTone } from '../../../../components/ui';
import { format } from 'date-fns';import { useAnnouncements } from '../hooks/useAnnouncements';
import { fetchAnnouncementList } from '../redux/announcementThunk';
import type { Announcement } from '../../../../types';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../hooks/useScopeOptions';
import { ENUM_LABELS, RECORD_STATUS, TARGET_TYPE, humanize } from '../../../../types';

export function AnnouncementsPage() {
  const { items, pagination, loading, error } = useAnnouncements();
  const { units, communities } = useScopeOptions();

  return (
    <ResourceListPage<Announcement>
      title="Announcements"
      description="Notices targeted at the district, a unit, a community, a committee or selected members."
      fetchList={fetchAnnouncementList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="publishDate"
      itemLabel="announcements"
      columns={[
        {
          key: 'title',
          header: 'Announcement',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.title}</p>
              <p className="truncate text-xs text-muted">{row.content}</p>
            </div>
          ),
        },
        {
          key: 'targetType',
          header: 'Audience',
          sortable: true,
          render: (row) => <Badge tone="info">{humanize(row.targetType)}</Badge>,
        },
        {
          key: 'publishDate',
          header: 'Published',
          sortable: true,
          render: (row) => format(new Date(row.publishDate), 'MMM d, yyyy'),
        },
        {
          key: 'expiryDate',
          header: 'Expires',
          priority: false,
          render: (row) =>
            row.expiryDate ? format(new Date(row.expiryDate), 'MMM d, yyyy') : '—',
        },
        {
          key: 'isPublic',
          header: 'Public',
          priority: false,
          render: (row) =>
            row.isPublic ? <Badge tone="success">Public</Badge> : <Badge>Internal</Badge>,
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
          name: 'targetType',
          label: 'TargetType',
          value: '',
          options: enumOptions(Object.values(TARGET_TYPE), ENUM_LABELS),
        },
        {
          name: 'status',
          label: 'Status',
          value: '',
          options: enumOptions(Object.values(RECORD_STATUS), ENUM_LABELS),
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

export default AnnouncementsPage;
