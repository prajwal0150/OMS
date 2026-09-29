import { ResourceListPage } from '../../../../components';
import { Badge, statusTone } from '../../../../components/ui';
import { format } from 'date-fns';import { useAttendances } from '../hooks/useAttendances';
import { fetchAttendanceList } from '../redux/attendanceThunk';
import type { AttendanceRecord } from '../../../../types';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../hooks/useScopeOptions';
import { ATTENDANCE_STATUS, ENUM_LABELS, humanize, refName } from '../../../../types';

export function AttendancePage() {
  const { items, pagination, loading, error } = useAttendances();
  const { units, communities } = useScopeOptions();

  return (
    <ResourceListPage<AttendanceRecord>
      title="Attendance"
      description="Attendance records for every event inside your scope."
      fetchList={fetchAttendanceList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="date"
      itemLabel="records"
      columns={[
        {
          key: 'date',
          header: 'Date',
          sortable: true,
          render: (row) => (
            <span className="whitespace-nowrap text-slate-700">
              {format(new Date(row.date), 'MMM d, yyyy')}
            </span>
          ),
        },
        {
          key: 'member',
          header: 'Member',
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">
                {refName(row.member) ?? 'Unknown member'}
              </p>
              <p className="truncate text-xs text-muted">{refName(row.unit) ?? ''}</p>
            </div>
          ),
        },
        {
          key: 'event',
          header: 'Event',
          priority: false,
          render: (row) => refName(row.event) ?? 'â€”',
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          render: (row) => (
            <Badge tone={statusTone(row.status)}>{humanize(row.status)}</Badge>
          ),
        },
        {
          key: 'checkIn',
          header: 'In / Out',
          priority: false,
          render: (row) => (
            <span className="whitespace-nowrap text-xs text-slate-600">
              {row.checkIn ?? 'â€”'} / {row.checkOut ?? 'â€”'}
            </span>
          ),
        },
        {
          key: 'remarks',
          header: 'Remarks',
          priority: false,
          render: (row) => row.remarks ?? 'â€”',
        },
      ]}
      filters={[
        {
          name: 'status',
          label: 'Status',
          value: '',
          options: enumOptions(Object.values(ATTENDANCE_STATUS), ENUM_LABELS),
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

export default AttendancePage;
