import { Link } from 'react-router-dom';
import { ArrowRight, UsersRound } from 'lucide-react';
import { Badge } from '../../../../components';
import { humanize, refName, type ContentRecord } from '../../../../types';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import { Reveal, Stagger, StaggerItem } from './motion';
import { MotionCard, StoryHeading } from './motionExtras';

const GROUP_COLOR: Record<string, string> = {
  YOUTH: 'bg-emerald-50 text-emerald-700',
  WOMEN: 'bg-pink-50 text-pink-700',
  PARENTS: 'bg-amber-50 text-amber-700',
};

/** Community Highlights: WHAT communities are doing — never a static grid. */
export function CommunityHighlights({ items }: { items: ContentRecord[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <StoryHeading eyebrow="Community life" title="Community highlights" description="Stories of what Parents, Women and Youth communities are doing." />
        <Reveal delay={0.1}>
          <Link to="/activities" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            More stories <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Reveal>
      </div>
      <Stagger className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.12}>
        {items.slice(0, 3).map((item) => {
          const unit = refName(item.unit);
          const community = refName(item.community);
          const group = typeof item.community === 'object' && item.community && 'targetGroup' in item.community ? String((item.community as { targetGroup?: string }).targetGroup ?? '') : '';
          return (
            <StaggerItem key={item._id}>
              <MotionCard className="h-full overflow-hidden rounded-lg border border-line bg-white shadow-sm">
                <Link to={`/content/${item.slug}`} className="group flex h-full flex-col">
                  {item.coverImage ? (<img src={resolveAssetUrl(item.coverImage)} alt="" loading="lazy" className="h-40 w-full object-cover" />) : (
                    <span className="flex h-40 items-center justify-center bg-gradient-to-br from-primary-soft via-white to-emerald-50"><UsersRound className="h-8 w-8 text-primary/40" aria-hidden /></span>
                  )}
                  <span className="flex flex-1 flex-col p-3">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {community && <Badge tone="purple">{community}</Badge>}
                      {group && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${GROUP_COLOR[group] ?? 'bg-slate-100 text-slate-600'}`}>{humanize(group)}</span>}
                    </span>
                    <span className="mt-1.5 line-clamp-2 text-sm font-semibold text-secondary group-hover:text-primary">{item.title}</span>
                    {unit && <span className="mt-1 text-[11px] font-medium text-muted">via {unit}{community ? ` · ${community}` : ''}</span>}
                  </span>
                </Link>
              </MotionCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
export default CommunityHighlights;
