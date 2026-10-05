import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Play, X } from 'lucide-react';
import { EmptyState } from '../../../../components';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import { VideoEmbed } from '../../Layouts/components/publicSections';
import { Reveal, Stagger, StaggerItem } from './motion';
import { StoryHeading } from './motionExtras';
import type { ContentRecord } from '../../../../types';

interface VideoItem { url: string; caption?: string; thumbnail?: string; source: string; }

export function WatchStories({ items }: { items: ContentRecord[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<VideoItem | null>(null);
  const videos: VideoItem[] = [];
  for (const item of items) {
    for (const v of item.videos ?? []) {
      if (v.videoUrl) videos.push({ url: v.videoUrl, caption: v.caption ?? item.title, thumbnail: v.thumbnail, source: item.title });
      if (videos.length >= 3) break;
    }
    if (videos.length >= 3) break;
  }
  if (videos.length === 0) return null;
  const thumbOf = (v: VideoItem) => v.thumbnail ? resolveAssetUrl(v.thumbnail) : undefined;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <StoryHeading eyebrow="Watch" title="Watch our stories" description="Video moments shared by the district and communities." align="left" />
      <Stagger className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
        {videos.map((v, idx) => (
          <StaggerItem key={`${v.url}-${idx}`}>
            <button type="button" onClick={() => setActive(v)}
              className="group relative block w-full overflow-hidden rounded-lg border border-line text-left shadow-sm">
              {thumbOf(v) ? (<img src={thumbOf(v)} alt="" loading="lazy" className="aspect-video w-full object-cover" />) : (
                <span className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-secondary via-slate-800 to-primary">
                  <Play className="h-10 w-10 text-white/80" aria-hidden />
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-primary shadow-md transition-transform group-hover:scale-110">
                  <Play className="h-5 w-5 fill-current" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-3 pt-8">
                <span className="line-clamp-2 block text-[13px] font-semibold text-white">{v.caption ?? v.source}</span>
              </span>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4" onClick={() => setActive(null)} role="dialog" aria-modal="true" aria-label="Video player">
            <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <p className="truncate text-xs font-medium text-secondary">{active.caption ?? 'Video'}</p>
                <button type="button" onClick={() => setActive(null)} aria-label="Close player" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" aria-hidden /></button>
              </div>
              <div className="p-3"><VideoEmbed url={active.url} caption={active.caption} /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {videos.length === 0 && (<Reveal><EmptyState title="No videos yet" description="Video stories will appear here when published." /></Reveal>)}
    </section>
  );
}
export default WatchStories;
