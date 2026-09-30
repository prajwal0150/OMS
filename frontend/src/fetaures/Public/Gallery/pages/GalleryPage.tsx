import { PublicPageHeader, PublicState } from '../../Layouts/components/publicSections';
import { usePublicDetail } from '../../hooks/usePublicData';
import { fetchGalleryPublic } from '../../services/publicService';
import { resolveAssetUrl } from '../../../../services/api/httpClient';

export function GalleryPage() {
  const { data: images, loading, error, reload } = usePublicDetail(() => fetchGalleryPublic(72));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PublicPageHeader
        eyebrow="Photos"
        title="Photo gallery"
        description="Photographs from events, meetings and community programs across the district."
      />

      <PublicState
        loading={loading}
        error={error}
        isEmpty={!images || images.length === 0}
        onRetry={reload}
        emptyTitle="No photos yet"
        emptyDescription="Photos attached to published stories will appear here."
        skeletonCount={9}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {(images ?? []).map((image, index) => (
            <figure
              key={`${image.url}-${index}`}
              className="group overflow-hidden rounded-lg border border-line bg-white shadow-sm"
            >
              <img
                src={resolveAssetUrl(image.url)}
                alt={image.alt ?? image.caption ?? ''}
                loading="lazy"
                className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {image.caption && (
                <figcaption className="px-2.5 py-1.5 text-xs text-muted">{image.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
      </PublicState>
    </div>
  );
}

export default GalleryPage;
