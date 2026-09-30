import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  IdCard,
  Megaphone,
  Network,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Badge,
  Card,
  ErrorState,
  Section,
  Skeleton,
  StatCard,
  statusTone,
} from '../../../../../components';
import {
  ChartCard,
  BreakdownBars,
  BreakdownDonut,
  withLabels,
} from '../components/DashboardCharts';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { loadDashboard } from '../redux/dashboardThunk';
import {
  selectDashboardData,
  selectDashboardError,
  selectDashboardLoading,
} from '../redux/dashboardSelector';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import { humanize, refName, type DashboardData } from '../../../../../types';


/**
 * Scope aware dashboard. Every figure comes from the analytics endpoint,
 * which applies the caller's district / unit / community scope in MongoDB.
 * Units are never ranked against each other.
 */
export function DashboardPage() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectDashboardData);
  const loading = useAppSelector(selectDashboardLoading);
  const error = useAppSelector(selectDashboardError);
  const { isSuperAdmin, displayName } = useAuthState();

  useEffect(() => {
    void dispatch(loadDashboard(undefined));
  }, [dispatch]);

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={() => void dispatch(loadDashboard(undefined))} />;
  }
  if (!data) return null;

  /* Every series is read defensively: a partially populated analytics payload
     must degrade to an empty chart, never to a render-time crash. */
  const charts = {
    membersByUnit: data.charts?.membersByUnit ?? [],
    membersByCommunity: data.charts?.membersByCommunity ?? [],
    monthlyGrowth: data.charts?.monthlyGrowth ?? [],
    attendanceTrend: data.charts?.attendanceTrend ?? [],
    contentActivity: data.charts?.contentActivity ?? [],
  };
  const upcomingEvents = data.upcomingEvents ?? [];
  const totals = data.totals ?? ({} as DashboardData['totals']);
  const members = data.members ?? { total: 0, active: 0, pending: 0 };

  const stats = [
    { label: 'Total members', value: members.total, icon: IdCard, to: '/admin/members' },
    { label: 'Active members', value: members.active, icon: CheckCircle2, to: '/admin/members' },
    { label: 'Pending members', value: members.pending, icon: Clock, to: '/admin/members' },
    { label: 'Units', value: totals.units, icon: Network, to: '/admin/units' },
    { label: 'Communities', value: totals.communities, icon: UsersRound, to: '/admin/communities' },
    { label: 'Committees', value: totals.committees, icon: ShieldCheck, to: '/admin/committees' },
    { label: 'Upcoming events', value: totals.upcomingEvents, icon: CalendarDays, to: '/admin/events' },
    {
      label: 'Published content',
      value: totals.contentPublished ?? totals.content,
      icon: FileText,
      to: '/admin/content',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-secondary">Welcome, {displayName}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {isSuperAdmin
              ? 'Organization-wide overview across every district, unit and community.'
              : 'Overview limited to your assigned organizational scope.'}
          </p>
        </div>
        {data.todayAttendance && (
          <Card padding="sm" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden />
            <div>
              <p className="text-xs text-muted">Today&apos;s attendance</p>
              <p className="text-sm font-semibold text-secondary">
                {data.todayAttendance.present} present / {data.todayAttendance.total} recorded
                <span className="ml-1 text-xs font-normal text-muted">
                  ({data.todayAttendance.attendancePercentage}%)
                </span>
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <StatCard label={stat.label} value={stat.value} icon={<stat.icon className="h-4 w-4" />} />
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Section title="Members by unit">
          <Card>
            <BreakdownDonut rows={charts.membersByUnit} />
          </Card>
        </Section>

        <Section title="Members by community">
          <ChartCard
            title=""
            isEmpty={charts.membersByCommunity.length === 0}
            emptyMessage="No data yet"
          >
            <BreakdownBars rows={charts.membersByCommunity} color="#14b8a6" />
          </ChartCard>
        </Section>

        <Section title="Monthly member growth">
          <ChartCard
            title=""
            isEmpty={charts.monthlyGrowth.length === 0}
            emptyMessage="No registrations yet"
          >
            <LineChart data={withLabels(charts.monthlyGrowth)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ChartCard>
        </Section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Attendance trend">
          <ChartCard
            title=""
            isEmpty={charts.attendanceTrend.length === 0}
            emptyMessage="No attendance recorded yet"
          >
            <BarChart data={withLabels(charts.attendanceTrend)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Bar dataKey="present" stackId="a" fill="#16a34a" />
              <Bar dataKey="late" stackId="a" fill="#f59e0b" />
              <Bar dataKey="absent" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
        </Section>

        <Section title="Content publishing activity">
          <ChartCard
            title=""
            isEmpty={charts.contentActivity.length === 0}
            emptyMessage="No content published yet"
          >
            <BarChart data={withLabels(charts.contentActivity)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
        </Section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section
          title="Upcoming events"
          actions={
            <Link to="/admin/events" className="text-sm text-primary hover:underline">
              View all
            </Link>
          }
        >
          <Card padding="none">
            {upcomingEvents.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">No upcoming events</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcomingEvents.map((event) => (
                  <li key={event._id} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-11 shrink-0 rounded-lg bg-primary-soft p-1 text-center">
                      <p className="text-sm leading-none font-semibold text-primary">
                        {format(new Date(event.startDate), 'dd')}
                      </p>
                      <p className="text-[10px] text-primary/80 uppercase">
                        {format(new Date(event.startDate), 'MMM')}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{event.title}</p>
                      <p className="truncate text-xs text-muted">
                        {humanize(event.type)} - {refName(event.unit) ?? 'District'}
                      </p>
                    </div>
                    <Badge tone={statusTone(event.status)}>{humanize(event.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>

        <Section title="At a glance">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Announcements', value: totals.announcements, icon: Megaphone, to: '/admin/announcements' },
              { label: 'Documents', value: totals.documents, icon: FileText, to: '/admin/content' },
              { label: 'Media files', value: totals.media, icon: Network, to: '/admin/content' },
              { label: 'Pending review', value: totals.contentPending ?? 0, icon: TrendingUp, to: '/admin/content/review' },
            ].map((item) => (
              <Link key={item.label} to={item.to}>
                <Card className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <item.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted">{item.label}</p>
                    <p className="text-lg font-semibold text-secondary">{item.value}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

export default DashboardPage;
