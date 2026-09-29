import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays, MapPin, Megaphone, Newspaper, UsersRound } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../../../components';
import { usePublicList } from '../../hooks/usePublicData';
import {
  fetchAnnouncementsPublic,
  fetchContentPublic,
  fetchEventsPublic,
  fetchUnitsPublic,
  fetchCommunitiesPublic,
} from '../../services/publicService';
import { refName, type Announcement, type ContentRecord, type EventRecord } from '../../../../types';

/** Landing page: the organization at a glance plus the freshest public items. */
export function HomePage() {
  const content = usePublicList<ContentRecord>(fetchContentPublic, { limit: 3 });
  const events = usePublicList<EventRecord>(fetchEventsPublic, { limit: 3 });
  const announcements = usePublicList<Announcement>(fetchAnnouncementsPublic, { limit: 3 });
  const units = usePublicList(fetchUnitsPublic, { limit: 100 });
  const communities = usePublicList(fetchCommunitiesPublic, { limit: 100 });

  return (
    <div>
      <section className="rounded-lg bg-primary p-6 text-white lg:p-10">
        <h1 className="text-2xl font-semibold lg:text-3xl">HEAVENLY PATH SUNSARI DISTRICT</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Parents, Women and Youth communities working together across Itahari, Dharan,
          Barahachhhetra and Saune.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/about">
            <Button size="sm" variant="secondary" leftIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              About the district
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10">
              Contact us
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Units', value: units.items.length, icon: MapPin, to: '/units' },
          {
            label: 'Communities',
            value: communities.items.length,
            icon: UsersRound,
            to: '/communities',
          },
          { label: 'Events', value: events.items.length, icon: CalendarDays, to: '/events' },
          {
            label: 'Announcements',
            value: announcements.items.length,
            icon: Megaphone,
            to: '/announcements',
          },
        ].map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <stat.icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="text-lg font-semibold text-secondary">
                  {units.loading || communities.loading || events.loading ? '--' : (stat.value ?? 0)}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-2 text-lg font-semibold text-secondary">Latest content</h2>
          {content.loading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-44 w-full rounded-lg" />
              ))}
            </div>
          ) : content.items.length === 0 ? (
            <Card padding="none">
              <EmptyState title="No content yet" icon={<Newspaper className="h-5 w-5" />} />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {content.items.map((item) => (
                <Link
                  key={item._id}
                  to={`/content/${item.slug}`}
                  className="group overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-colors hover:border-primary/40"
                >
                  {item.coverImage ? (
                    <img src={item.coverImage} alt="" loading="lazy" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-slate-50 text-slate-300">
                      <Newspaper className="h-6 w-6" aria-hidden />
                    </div>
                  )}
                  <div className="p-3">
                    <Badge tone="primary">{item.contentType}</Badge>
                    <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold text-secondary group-hover:text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{item.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link to="/content" className="mt-2 inline-block text-sm text-primary hover:underline">
            View all content
          </Link>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-secondary">Upcoming events</h2>
          <Card padding="none">
            {events.loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : events.items.length === 0 ? (
              <EmptyState title="No upcoming events" icon={<CalendarDays className="h-5 w-5" />} />
            ) : (
              <ul className="divide-y divide-line">
                {events.items.map((event) => (
                  <li key={event._id} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 shrink-0 rounded-lg bg-primary-soft p-1 text-center">
                      <p className="text-sm leading-none font-semibold text-primary">
                        {format(new Date(event.startDate), 'dd')}
                      </p>
                      <p className="text-[10px] text-primary/80 uppercase">
                        {format(new Date(event.startDate), 'MMM')}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{event.title}</p>
                      <p className="truncate text-xs text-muted">{event.location ?? ''}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      <section className="mt-4">
        <h2 className="mb-2 text-lg font-semibold text-secondary">Announcements</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {announcements.loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-lg" />
            ))
          ) : announcements.items.length === 0 ? (
            <Card padding="none" className="sm:col-span-2 lg:col-span-3">
              <EmptyState title="No announcements" icon={<Megaphone className="h-5 w-5" />} />
            </Card>
          ) : (
            announcements.items.map((announcement) => (
              <Card key={announcement._id}>
                <div className="flex items-start gap-2">
                  <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-secondary">{announcement.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{announcement.content}</p>
                    <p className="mt-1 text-[11px] text-muted">{refName(announcement.unit) ?? 'All units'}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
