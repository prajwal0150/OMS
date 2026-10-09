import { usePublicDetail, usePublicList } from '../../hooks/usePublicData';
import { fetchAnnouncementsPublic, fetchContentPublic, fetchEventsPublic, fetchGalleryPublic, fetchUnitsPublic } from '../../services/publicService';
import type { Announcement, ContentRecord, EventRecord, Unit } from '../../../../types';
import type { GalleryImage } from '../../services/publicService';
import { HeroSection } from '../components/HeroSection';
import { LatestNewsStory } from '../components/LatestNewsStory';
import { ActivitiesStory } from '../components/ActivitiesStory';
import { EventsStory } from '../components/EventsStory';
import { CommunityHighlights } from '../components/CommunityHighlights';
import { EditorialStories } from '../components/EditorialStories';
import { MomentsGallery } from '../components/MomentsGallery';
import { WatchStories } from '../components/WatchStories';
import { AnnouncementsStory } from '../components/AnnouncementsStory';
import { FinalCta, ImpactStrip } from '../components/ClosingSections';
import '../styles/motion.css';

const pickByTypes = (items: ContentRecord[], types: string[]) =>
  items.filter((i) => types.includes(i.contentType));

/**
 * Types the Activities section renders, newest first. `NEWS` and `ACTIVITY`
 * are what the admin composer publishes, so every post that goes live shows up
 * in this section; the legacy activity-ish types keep their slots behind it.
 */
const ACTIVITY_SECTION_TYPES = [
  'ACTIVITY',
  'NEWS',
  'TRAINING',
  'AWARENESS',
  'MEETING_REPORT',
  'EVENT_STORY',
];

/** Content-first story homepage: hero, live stories, events, gallery, CTA. */
export function HomePage() {
  const content = usePublicList<ContentRecord>(fetchContentPublic, { limit: 12 });
  const events = usePublicList<EventRecord>(fetchEventsPublic, { limit: 12 });
  const announcements = usePublicList<Announcement>(fetchAnnouncementsPublic, { limit: 6 });
  const units = usePublicList<Unit>(fetchUnitsPublic, { limit: 20 });
  const gallery = usePublicDetail<GalleryImage[]>(() => fetchGalleryPublic(24));

  const items = content.items;
  const latest = items.slice(0, 5);
  const activities = pickByTypes(items, ACTIVITY_SECTION_TYPES).slice(0, 4);
  const activityFallback = activities.length > 0 ? activities : items.slice(0, 4);
  const communityStories = pickByTypes(items, ['COMMUNITY_STORY']).slice(0, 3);
  const editorial = items.slice(0, 3);

  const unitTotal = units.pagination?.pagination?.total ?? units.items.length;
  const totals = [
    { label: 'Units', value: unitTotal, hint: 'across Sunsari' },
    { label: 'Stories', value: content.pagination?.pagination?.total ?? items.length, hint: 'published updates' },
    { label: 'Events', value: events.pagination?.pagination?.total ?? events.items.length, hint: 'on the calendar' },
    { label: 'Notices', value: announcements.pagination?.pagination?.total ?? announcements.items.length, hint: 'announcements' },
  ];
  const totalsLoading = content.loading || events.loading || announcements.loading || units.loading;

  return (
    <div className="overflow-x-clip">
      <HeroSection />
      <div className="pb-2">
        <LatestNewsStory items={latest} loading={content.loading} error={content.error} onRetry={content.refresh} />
        <ActivitiesStory items={activityFallback} loading={content.loading} error={content.error} onRetry={content.refresh} />
        <EventsStory items={events.items} loading={events.loading} error={events.error} onRetry={events.refresh} />
        <CommunityHighlights items={communityStories} />
        <EditorialStories items={editorial} />
        <MomentsGallery images={gallery.data ?? []} loading={gallery.loading} error={gallery.error} onRetry={gallery.reload} />
        <WatchStories items={items} />
        <AnnouncementsStory items={announcements.items} loading={announcements.loading} error={announcements.error} onRetry={announcements.refresh} />
        <ImpactStrip totals={totals} loading={totalsLoading} />
        <FinalCta />
      </div>
    </div>
  );
}

export default HomePage;

