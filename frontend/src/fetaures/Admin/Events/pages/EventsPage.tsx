import { ResourceListPage } from '../../../../components';
import { Badge, statusTone } from '../../../../components/ui';
import { format } from 'date-fns';import { useEvents } from '../hooks/useEvents';
import { fetchEventList } from '../redux/eventThunk';
import type { EventRecord } from '../../../../types';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../hooks/useScopeOptions';
import { ENUM_LABELS, EVENT_STATUS, EVENT_TYPE, humanize, refName } from '../../../../types';

export function EventsPage() {
  const { items, pagination, loading, error } = useEvents();
  const { units, communities } = useScopeOptions();

  return (
    <ResourceListPage<EventRecord>
      title="Events"
      description="Meetings, training, awareness programs and community events."
      fetchList={fetchEventList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="startDate"
      itemLabel="events"
      columns={[
        {
          key: 'title',
          header: 'Event',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.title}</p>
              <p className="truncate text-xs text-muted">{row.location ?? 'Location to be announced'}</p>
            </div>
          ),
        },
        {
          key: 'type',
          header: 'Type',
          sortable: true,
          render: (row) => humanize(row.type),
        },
        {
          key: 'startDate',
          header: 'Date',
          sortable: true,
          render: (row) => (
            <span className="whitespace-nowrap text-slate-700">
              {format(new Date(row.startDate), 'MMM d, yyyy')}
              {row.startTime ? ` ${row.startTime}` : ''}
            </span>
          ),
        },
        {
          key: 'unit',
          header: 'Unit',
          priority: false,
          render: (row) => refName(row.unit) ?? refName(row.district) ?? 'â€”',
        },
        {
          key: 'capacity',
          header: 'Capacity',
          priority: false,
          align: 'right',
          render: (row) => row.capacity ?? 'â€”',
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
          name: 'type',
          label: 'Type',
          value: '',
          options: enumOptions(Object.values(EVENT_TYPE), ENUM_LABELS),
        },
        {
          name: 'status',
          label: 'Status',
          value: '',
          options: enumOptions(Object.values(EVENT_STATUS), ENUM_LABELS),
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

export default EventsPage;
