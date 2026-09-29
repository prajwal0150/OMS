import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Eye, MapPin, Users } from 'lucide-react';
import { Badge, ErrorState, ImageGallery, LoadingState } from '../../../../components/ui';
import { humanize, refName } from '../../../../types';
import { VideoEmbed } from '../../Layouts/components/publicSections';
import { usePublicDetail, usePublicList } from '../../hooks/usePublicData';
import { fetchContentBySlug, fetchContentPublic } from '../../services/publicService';

export function ContentDetailsPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: content, loading, error, reload } = usePublicDetail(() => fetchContentBySlug(slug));
  const related = usePublicList(fetchContentPublic, { limit: 4 });

  if (loading) return <LoadingState label="Loading article..." />;
  if (error || !content) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <ErrorState title="Article not found" message={error ?? undefined} onRetry={reload} />
        <Link to="/content" className="mt-3 inline-block text-sm text-primary hover:underline">
          Back to activities
        </Link>
      </div>
    );
  }

  const publisher = refName(content.publishedBy) ?? refName(content.author);
  const scope = [refName(content.unit), refName(content.community)].filter(Boolean).join(' - ');

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/content" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to activities
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="primary">{humanize(content.contentType)}</Badge>
        {content.publishedAt && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Calendar className="h-3 w-3" aria-hidden />
            {format(new Date(content.publishedAt), 'MMMM d, yyyy')}
          </span>
        )}
        {content.views !== undefined && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Eye className="h-3 w-3" aria-hidden />
            {content.views} views
          </span>
        )}
      </div>

      <h1 className="mt-2 text-2xl font-semibold text-secondary">{content.title}</h1>

      <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
        {publisher && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden />
            Published by {publisher}
          </span>
        )}
        {(scope || refName(content.district)) && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {scope || refName(content.district)}
          </span>
        )}
      </p>

      {content.coverImage && (
        <img src={content.coverImage} alt="" className="mt-4 w-full rounded-lg border border-line object-cover" />
      )}

      {/* The server sanitizes this HTML before persisting it. */}
      <div className="rich-text mt-4" dangerouslySetInnerHTML={{ __html: content.content }} />

      {content.gallery && content.gallery.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-base font-semibold text-secondary">Gallery</h2>
          <ImageGallery images={content.gallery} />
        </section>
      )}

      {content.videos && content.videos.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-base font-semibold text-secondary">Videos</h2>
          <div className="space-y-3">
            {content.videos.map((video) => (
              <VideoEmbed key={video.videoUrl} url={video.videoUrl} caption={video.caption} />
            ))}
          </div>
        </section>
      )}

      {related.items.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-base font-semibold text-secondary">Related content</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.items
              .filter((item) => item._id !== content._id)
              .slice(0, 3)
              .map((item) => (
                <Link
                  key={item._id}
                  to={`/content/${item.slug}`}
                  className="rounded-lg border border-line bg-white p-3 transition-colors hover:border-primary/40"
                >
                  <Badge tone="neutral">{humanize(item.contentType)}</Badge>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-secondary">{item.title}</p>
                </Link>
              ))}
          </div>
        </section>
      )}
    </article>
  );
}

export default ContentDetailsPage;
