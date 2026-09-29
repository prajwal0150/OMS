import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Megaphone,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Section,
  StatCard,
  statusTone,
} from '../../../../components';
import { usePortalData } from '../../hooks/usePortalData';
import {
  fetchMyAnnouncements,
  fetchMyAttendanceSummary,
  fetchMyCommittees,
  fetchMyContent,
  fetchMyEvents,
  fetchMyProfile,
} from '../../services/memberPortalService';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import {
  humanize,
  refName,
  type Announcement,
  type AttendanceSummary,
  type Committee,
  type ContentRecord,
  type EventRecord,
  type Member,
} from '../../../../types';

export function MemberDashboardPage() {
  const { displayName } = useAuthState();

  const profile = usePortalData<Member>(useCallback(() => fetchMyProfile(), []));
  const summary = usePortalData<AttendanceSummary>(
    useCallback(() => fetchMyAttendanceSummary(), []),
  );
  const committees = usePortalData<Committee[]>(useCallback(() => fetchMyCommittees(), []));
  const events = usePortalData<{ items: EventRecord[] }>(
    useCallback(() => fetchMyEvents({ limit: 4 }), []),
  );
  const content = usePortalData<{ items: ContentRecord[] }>(
    useCallback(() => fetchMyContent({ limit: 4 }), []),
  );
  const announcements = usePortalData<{ items: Announcement[] }>(
    useCallback(() => fetchMyAnnouncements({ limit: 3 }), []),
  );

  if (profile.loading) return <LoadingState label="Loading your dashboard..." />;
  if (profile.error) return <ErrorState message={profile.error} onRetry={profile.reload} />;

  const member = profile.data;
  const communityNames = (member?.communities ?? [])
    .map((community) => refName(community))
    .filter(Boolean);

  const stats = [
    {
      label: 'Attendance rate',
      value: `${summary.data?.attendancePercentage ?? 0}%`,
      icon: ClipboardCheck,
      to: '/portal/attendance',
    },
    { label: 'Events', value: events.data?.items.length ?? 0, icon: CalendarDays, to: '/portal/events' },
    {
      label: 'Committees',
      value: committees.data?.length ?? 0,
      icon: ShieldCheck,
      to: '/portal/committees',
    },
    {
      label: 'Communities',
      value: communityNames.length,
      icon: UsersRound,
      to: '/portal/communities',
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold text-secondary">Welcome back, {displayName}</h1>
        <p className="mt-0.5 text-sm text-muted">
          {member?.memberId} - {refName(member?.unit) ?? 'District'} -{' '}
          {refName(member?.district) ?? 'Sunsari'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <StatCard label={stat.label} value={stat.value} icon={<stat.icon className="h-4 w-4" />} />
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section
          title="Upcoming events"
          actions={
            <Link to="/portal/events" className="text-sm text-primary hover:underline">
              View all
            </Link>
          }
        >
          <Card padding="none">
            {(events.data?.items ?? []).length === 0 ? (
              <EmptyState title="No events" icon={<CalendarDays className="h-5 w-5" />} />
            ) : (
              <ul className="divide-y divide-line">
                {(events.data?.items ?? []).map((event) => (
                  <li key={event._id} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 shrink-0 rounded-lg bg-primary-soft p-1 text-center">
                      <p className="text-sm leading-none font-semibold text-primary">
                        {format(new Date(event.startDate), 'dd')}
                      </p>
                      <p className="text-[10px] text-primary/80 uppercase">
                        {format(new Date(event.startDate), 'MMM')}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{event.title}</p>
                      <p className="truncate text-xs text-muted">{event.location ?? ''}</p>
                    </div>
                    <Badge tone={statusTone(event.status)}>{humanize(event.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>

        <Section
          title="Announcements"
          actions={
            <Link to="/portal/announcements" className="text-sm text-primary hover:underline">
              View all
            </Link>
          }
        >
          <Card padding="none">
            {(announcements.data?.items ?? []).length === 0 ? (
              <EmptyState title="No announcements" icon={<Megaphone className="h-5 w-5" />} />
            ) : (
              <ul className="divide-y divide-line">
                {(announcements.data?.items ?? []).map((announcement) => (
                  <li key={announcement._id} className="px-3 py-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {announcement.title}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted">{announcement.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>
      </div>

      <Section
        title="Latest content"
        actions={
          <Link to="/portal/content" className="text-sm text-primary hover:underline">
            View all
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(content.data?.items ?? []).map((item) => (
            <Link
              key={item._id}
              to={`/content/${item.slug}`}
              className="overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-colors hover:border-primary/40"
            >
              {item.coverImage ? (
                <img src={item.coverImage} alt="" loading="lazy" className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-slate-50 text-slate-300">
                  <FileText className="h-6 w-6" aria-hidden />
                </div>
              )}
              <div className="p-2.5">
                <Badge tone="primary">{humanize(item.contentType)}</Badge>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">{item.title}</p>
              </div>
            </Link>
          ))}
          {(content.data?.items ?? []).length === 0 && (
            <Card padding="none" className="sm:col-span-2 lg:col-span-4">
              <EmptyState title="No content yet" icon={<FileText className="h-5 w-5" />} />
            </Card>
          )}
        </div>
      </Section>
    </div>
  );
}

export default MemberDashboardPage;
