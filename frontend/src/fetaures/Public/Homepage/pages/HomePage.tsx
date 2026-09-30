import { Link } from 'react-router-dom';
import { ArrowRight, UsersRound } from 'lucide-react';
import { Button } from '../../../../components';
import { usePublicList } from '../../hooks/usePublicData';
import {
  fetchAnnouncementsPublic,
  fetchContentPublic,
  fetchUnitsPublic,
} from '../../services/publicService';
import type { Announcement, ContentRecord, Unit } from '../../../../types';
import { HeroSection } from '../components/HeroSection';
import { QuickLinksRow } from '../components/QuickLinksRow';
import { LatestNewsPanel } from '../components/LatestNewsPanel';
import { UnitsPanel } from '../components/UnitsPanel';
import { AnnouncementsPanel, QuickAccessPanel } from '../components/SidePanels';

/**
 * Public landing page: hero, quick links, latest news, units, sidebar with
 * quick access and announcements, plus the join-our-community call to action.
 */
export function HomePage() {
  const content = usePublicList<ContentRecord>(fetchContentPublic, { limit: 3 });
  const announcements = usePublicList<Announcement>(fetchAnnouncementsPublic, { limit: 4 });
  const units = usePublicList<Unit>(fetchUnitsPublic, { limit: 100 });

  const unitTotal = units.pagination?.pagination?.total ?? units.items.length;
  const topUnits = units.items.slice(0, 4);

  return (
    <div>
      <HeroSection />

      <div className="mx-auto w-full max-w-7xl px-4">
        <QuickLinksRow unitCount={unitTotal} />

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main column */}
          <div className="min-w-0 space-y-4">
            <LatestNewsPanel
              items={content.items}
              loading={content.loading}
              error={content.error}
              onRetry={content.refresh}
            />
            <UnitsPanel
              items={topUnits}
              loading={units.loading}
              error={units.error}
              onRetry={units.refresh}
            />

            {/* Join our community banner */}
            <section className="flex flex-col gap-4 rounded-lg border border-blue-100 bg-primary-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <UsersRound className="h-7 w-7 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary">Join Our Community</p>
                  <p className="text-xs text-muted">
                    Be a part of something meaningful. Together we can make a difference.
                  </p>
                </div>
              </div>
              <Link to="/contact" className="shrink-0 self-start sm:self-auto">
                <Button
                  className="rounded-full px-5"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Learn More
                </Button>
              </Link>
            </section>
          </div>

          {/* Sidebar column */}
          <div className="min-w-0 space-y-4">
            <QuickAccessPanel />
            <AnnouncementsPanel
              items={announcements.items}
              loading={announcements.loading}
              error={announcements.error}
              onRetry={announcements.refresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
