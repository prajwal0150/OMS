import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Badge } from '../../../../components';
import { refName, type ContentRecord } from '../../../../types';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import { Reveal } from './motion';
import { StoryHeading } from './motionExtras';
import { badgeText, excerptOf, toneFor } from './storyCards';

/** Editorial reading experience: large image, story, publisher, date. */
export function EditorialStories({ items }: { items: ContentRecord[] }) {
  const stories = items.slice(0, 3);
  if (stories.length === 0) return null;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <StoryHeading eyebrow="From our community" title="Latest stories" description="Read the organization's story through recent publishing." />
      <div className="mt-5 space-y-6">
        {stories.map((item, idx) => {
          const publisher = refName(item.publishedBy) ?? refName(item.author);
          const scope = [refName(item.unit), refName(item.community)].filter(Boolean).join(' · ') || refName(item.district) || 'Sunsari';
          const date = item.publishedAt ?? item.createdAt;
          const flip = idx % 2 === 1;
          return (
            <Reveal key={item._id}>
              <Link to={`/content/${item.slug}`} className={`group grid overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-all hover:border-primary/40 hover:shadow-md lg:grid-cols-2 ${flip ? '' : ''}`}>
                <span className={`relative block overflow-hidden ${flip ? 'lg:order-2' : ''}`}>
                  {item.coverImage ? (<img src={resolveAssetUrl(item.coverImage)} alt="" loading="lazy" className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-64" />) : (<span className="flex h-56 w-full items-center justify-center bg-primary-soft sm:h-64"><Badge tone={toneFor(item.contentType)}>{badgeText(item.contentType)}</Badge></span>)}
                </span>
                <span className="flex flex-col justify-center p-4 sm:p-6">
                  <Badge tone={toneFor(item.contentType)}>{badgeText(item.contentType)}</Badge>
                  <span className="mt-2 block text-lg font-bold tracking-tight text-secondary group-hover:text-primary sm:text-xl">{item.title}</span>
                  <span className="mt-2 line-clamp-3 block text-sm leading-relaxed text-muted">{excerptOf(item)}</span>
                  <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                    {publisher && <span>Published by {publisher}</span>}
                    <span>{scope}</span>
                    {date && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" aria-hidden />{format(new Date(date), 'MMM d, yyyy')}</span>}
                  </span>
                  <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">Read story <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
export default EditorialStories;
