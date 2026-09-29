import { format } from 'date-fns';
import { CalendarCheck, Target } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  StatCard,
  statusTone,
} from '../../../../components/ui';
import { MemberToolbar } from '../../components/MemberToolbar';
import { usePortalData, usePortalList } from '../../hooks/usePortalData';
import { fetchMyAttendance, fetchMyAttendanceSummary } from '../../services/memberPortalService';
import { humanize, refName, type AttendanceRecord, type AttendanceSummary } from '../../../../types';

const summaryOf = (summary: AttendanceSummary | null) => [
  { label: 'Total records', value: summary?.total ?? 0, icon: CalendarCheck },
  { label: 'Present', value: summary?.present ?? 0, icon: CalendarCheck },
  { label: 'Late', value: summary?.late ?? 0, icon: CalendarCheck },
  { label: 'Attendance rate', value: `${summary?.attendancePercentage ?? 0}%`, icon: Target },
];

export function MyAttendancePage() {
  const { items, pagination, loading, error, setPage, search, setSearch, refresh } =
    usePortalList<AttendanceRecord>(fetchMyAttendance);
  const { data: summary } = usePortalData<AttendanceSummary>(fetchMyAttendanceSummary);

  return (
    <div>
      <MemberToolbar
        title="My attendance"
        description="Your attendance history across district, unit and community events."
        search={search}
        onSearchChange={setSearch}
      />

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryOf(summary).map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={<stat.icon className="h-4 w-4" />} />
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <Card>
          <Skeleton className="h-32 w-full" />
        </Card>
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No attendance records"
            description="Once you are marked for an event your record will appear here."
            icon={<CalendarCheck className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Event</th>
                <th scope="col">Status</th>
                <th scope="col" className="hidden md:table-cell">
                  In / Out
                </th>
                <th scope="col" className="hidden lg:table-cell">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((record) => (
                <tr key={record._id}>
                  <td className="whitespace-nowrap text-slate-700">
                    {format(new Date(record.date), 'MMM d, yyyy')}
                  </td>
                  <td className="text-slate-800">{refName(record.event) ?? 'Event'}</td>
                  <td>
                    <Badge tone={statusTone(record.status)}>{humanize(record.status)}</Badge>
                  </td>
                  <td className="hidden text-xs text-slate-600 md:table-cell">
                    {record.checkIn ?? '-'} / {record.checkOut ?? '-'}
                  </td>
                  <td className="hidden max-w-56 truncate text-xs text-slate-600 lg:table-cell">
                    {record.remarks ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={pagination?.pagination} onPageChange={setPage} itemLabel="records" />
    </div>
  );
}

export default MyAttendancePage;
