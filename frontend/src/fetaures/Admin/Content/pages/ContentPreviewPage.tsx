import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Monitor, Smartphone } from 'lucide-react';
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  statusTone,
} from '../../../../components';
import { fetchContentById } from '../services/contentService';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import { humanize, refName, type ContentRecord } from '../../../../types';

/** Renders a content record exactly as the public article page will. */
export function ContentPreviewPage() {
  const { id = '' } = useParams();
  const [record, setRecord] = useState<ContentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    fetchContentById(id)
      .then((found) => {
        if (active) setRecord(found);
      })
      .catch(() => {
        if (active) setError('That content could not be loaded, or is outside your scope.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <LoadingState label="Loading preview..." />;
  if (error) return <ErrorState message={error} />;
  if (!record) return <ErrorState message="Content not found." />;

  const paragraphs = (record.content ?? '').split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link to={`/admin/content/${id}/edit`}>
            <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Back to editor
            </Button>
          </Link>
          <Badge tone={statusTone(record.status)} dot>
            {humanize(record.status)}
          </Badge>
          <Badge tone="primary">{humanize(record.contentType)}</Badge>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
          {(
            [
              { key: 'desktop' as const, icon: Monitor, label: 'Desktop' },
              { key: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
            ]
          ).map((device) => (
            <button
              key={device.key}
              type="button"
              onClick={() => setWidth(device.key)}
              aria-label={device.label}
              aria-pressed={width === device.key}
              className={`rounded p-1.5 transition-colors ${
                width === device.key
                  ? 'bg-primary-soft text-primary'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <device.icon className="h-4 w-4" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      {record.status !== 'PUBLISHED' && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-slate-700">
          This is a preview. The content is {humanize(record.status).toLowerCase()} and is not visible
          on the public site yet.
        </p>
      )}

      <div
        className={`mx-auto overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-all ${
          width === 'mobile' ? 'max-w-sm' : 'max-w-3xl'
        }`}
      >
        <article>
          {record.coverImage && (
            <img
              src={resolveAssetUrl(record.coverImage)}
              alt=""
              className="h-56 w-full object-cover"
            />
          )}
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">{humanize(record.contentType)}</Badge>
              {record.tags?.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="mt-2 text-2xl font-semibold text-secondary">{record.title}</h1>
            {record.summary && (
              <p className="mt-1.5 text-base text-slate-600">{record.summary}</p>
            )}

            <p className="mt-3 border-b border-line pb-3 text-xs text-muted">
              {[refName(record.unit), refName(record.district)].filter(Boolean).join(' / ')}
              {record.publishedAt
                ? ` - published ${format(new Date(record.publishedAt), 'MMMM d, yyyy')}`
                : ''}
            </p>

            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {record.gallery && record.gallery.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {record.gallery.map((image) => (
                  <figure key={image.url} className="overflow-hidden rounded-lg border border-line">
                    <img
                      src={resolveAssetUrl(image.url)}
                      alt={image.alt ?? ''}
                      loading="lazy"
                      className="h-24 w-full object-cover"
                    />
                    {image.caption && (
                      <figcaption className="px-2 py-1 text-[11px] text-muted">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

export default ContentPreviewPage;
