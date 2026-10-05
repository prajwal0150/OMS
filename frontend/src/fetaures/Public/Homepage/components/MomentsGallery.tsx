import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Camera, Expand, X } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '../../../../components';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import { Reveal, Stagger, StaggerItem } from './motion';
import { StoryHeading } from './motionExtras';
import type { GalleryImage } from '../../services/publicService';

export function MomentsGallery({ images, loading, error, onRetry }: { images: GalleryImage[]; loading: boolean; error: string | null; onRetry: () => void }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <StoryHeading eyebrow="Captured moments" title="Moments from our activities" description="Real photographs from events and community programs." />
        <Reveal delay={0.1}>
          <Link to="/gallery" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Open gallery <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Reveal>
      </div>
      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={onRetry} /> : loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-40 w-full rounded-lg" />))}
          </div>
        ) : images.length === 0 ? (
          <EmptyState title="No photos yet" description="Photos attached to published stories will appear here." icon={<Camera className="h-5 w-5" />} />
        ) : (
          <Stagger className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" stagger={0.07}>
            {images.slice(0, 8).map((img, idx) => (
              <StaggerItem key={`${img.url}-${idx}`}>
                <button type="button" onClick={() => setActive(idx)}
                  className="group relative block w-full overflow-hidden rounded-lg border border-line bg-white text-left shadow-sm">
                  <img src={resolveAssetUrl(img.url)} alt={img.alt ?? img.caption ?? ''} loading="lazy"
                    className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  <span className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                    <Expand className="h-3.5 w-3.5" />
                  </span>
                  {img.caption && <span className="block truncate px-2.5 py-1.5 text-xs text-muted">{img.caption}</span>}
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
      <AnimatePresence>
        {active !== null && images[active] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4" onClick={() => setActive(null)} role="dialog" aria-modal="true" aria-label="Photo viewer">
            <motion.figure
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }} onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <p className="truncate text-xs text-muted">{images[active].caption ?? 'Photo'}</p>
                <button type="button" onClick={() => setActive(null)} aria-label="Close viewer" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" aria-hidden /></button>
              </div>
              <img src={resolveAssetUrl(images[active].url)} alt={images[active].alt ?? images[active].caption ?? ''} className="max-h-[70vh] w-full object-contain bg-slate-950" />
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
export default MomentsGallery;
