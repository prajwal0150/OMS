import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Reveal, Stagger, StaggerItem } from './motion';
import { StoryHeading } from './motionExtras';
import { StoryCard, StoryStates } from './storyCards';
import type { ContentRecord } from '../../../../types';

export function LatestNewsStory({ items, loading, error, onRetry }: { items: ContentRecord[]; loading: boolean; error: string | null; onRetry: () => void }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  // Desktop-only scroll-driven horizontal storytelling: pinned viewport,
  // vertical scroll drives an internal x transform. Mobile keeps native swipe.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const trackX = useTransform(scrollYProgress, [0, 1], ['2%', '-42%']);
  const hasStories = !error && !loading && items.length > 1;

  return (
    <section ref={sectionRef} className="relative mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <StoryHeading eyebrow="Latest updates" title="What is happening right now" description="Fresh stories published by the district, units and communities." />
        <Reveal delay={0.1}>
          <Link to="/activities" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View all stories <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Reveal>
      </div>
      <div className="mt-5">
        {error || loading || items.length === 0 ? (
          <StoryStates loading={loading} error={error} onRetry={onRetry} />
        ) : (
          <>
            <Reveal>
              <StoryCard item={items[0]} />
            </Reveal>
            {hasStories && (
              <>
                {/* Desktop: scroll-driven horizontal storytelling (lg+ only). */}
                <div className="mt-3 hidden overflow-hidden lg:block" aria-hidden={false}>
                  <motion.div style={reduce ? undefined : { x: trackX }} className="flex w-max gap-3 pb-1">
                    {items.slice(1, 5).map((item) => (
                      <div key={item._id} className="w-[22rem] shrink-0">
                        <StoryCard item={item} />
                      </div>
                    ))}
                  </motion.div>
                </div>
                {/* Mobile/tablet: native swipe carousel, no page overflow. */}
                <Stagger className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1 lg:hidden" stagger={0.1}>
                  {items.slice(1, 5).map((item) => (
                    <StaggerItem key={item._id} className="w-64 shrink-0 sm:w-72">
                      <StoryCard item={item} />
                    </StaggerItem>
                  ))}
                </Stagger>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
export default LatestNewsStory;
