import { MEDIA_CATEGORY } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { combineFilters, readEnum } from '../../shared/queryFilters';
import { applyScopeDefaults } from '../../shared/scope';
import { categoryForMime } from '../../middleware/upload';
import { getStorageProvider } from '../../services/storage';
import type { AuthUser } from '../../types/auth';
import type { CrudListResult } from '../../shared/crudController';
import { mediaRepository } from './media.repository';
import { contentRepository } from '../content/content.repository';
import type { MediaDocument } from './media.model';
import type { StoredFile } from '../../services/storage/StorageProvider';

export interface MediaUploadMetadata {
  title?: string;
  alt?: string;
  caption?: string;
  tags?: string[];
  category?: string;
}

/**
 * Media library. Files are persisted through the configured storage provider;
 * this service keeps the metadata and never touches the disk directly.
 */
export class MediaService extends ScopedCrudService<MediaDocument> {
  constructor() {
    super({
      entityLabel: 'Media',
      auditEntity: 'Media',
      repository: mediaRepository,
      buildListFilter: (query) =>
        combineFilters(
          readEnum(query.category, Object.values(MEDIA_CATEGORY))
            ? { category: query.category }
            : {},
          typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {},
          typeof query.community === 'string' && query.community
            ? { community: query.community }
            : {},
        ) as Record<string, unknown>,
      prepareCreate: (user, payload) => Promise.resolve({ ...payload, uploadedBy: user.id }),
    });
  }

  /** Persists uploaded files and stores their metadata in the library. */
  async uploadFiles(
    user: AuthUser,
    files: StoredFile[],
    metadata: MediaUploadMetadata = {},
  ): Promise<MediaDocument[]> {
    if (files.length === 0) throw ApiError.badRequest('No file uploaded');

    const created: MediaDocument[] = [];
    for (const file of files) {
      const category =
        (readEnum(metadata.category, Object.values(MEDIA_CATEGORY)) as
          | (typeof MEDIA_CATEGORY)[keyof typeof MEDIA_CATEGORY]
          | undefined) ?? (categoryForMime(file.mimeType) as MediaDocument['category']);

      const payload = applyScopeDefaults(user, {
        ...(metadata.title ? { title: metadata.title } : { title: file.originalName }),
        fileName: file.key,
        originalName: file.originalName,
        fileType: file.mimeType,
        fileSize: file.size,
        storageUrl: file.url,
        storageKey: file.key,
        storageProvider: file.storageProvider,
        category,
        alt: metadata.alt,
        caption: metadata.caption,
        tags: metadata.tags ?? [],
        uploadedBy: user.id,
      });

      created.push(await mediaRepository.create(payload));
    }
    return created;
  }

  async removeMedia(user: AuthUser, id: string): Promise<void> {
    const media = await mediaRepository.findByIdScoped(id, user, 'Media');
    await getStorageProvider()
      .remove(media.storageKey)
      .catch(() => undefined);
    await mediaRepository.deleteById(id);
  }

  /**
   * Links media to an entity.
   *
   * For a `Content` target the image is *also* mirrored into the content's own
   * `gallery[]` array. The public gallery is served from `content.gallery[]`,
   * while `usage[]` lives on the media document - without this bridge the two
   * stay disconnected and an uploaded, attached photo would never appear on
   * the public site.
   */
  async attach(user: AuthUser, mediaIds: string[], entity: string, entityId: string) {
    const media: MediaDocument[] = [];
    for (const id of mediaIds) {
      media.push(await mediaRepository.findByIdScoped(id, user, 'Media'));
    }
    await mediaRepository.attachUsage(mediaIds, entity, entityId);

    if (entity === 'Content') {
      await this.syncContentGallery(user, media, entityId);
    }

    return { attached: mediaIds.length };
  }

  /** Adds newly attached images to `content.gallery[]`, skipping duplicates. */
  private async syncContentGallery(
    user: AuthUser,
    media: MediaDocument[],
    contentId: string,
  ): Promise<void> {
    const images = media.filter((entry) => entry.category === MEDIA_CATEGORY.IMAGE);
    if (images.length === 0) return;

    // Scope checked so media can never be pushed into an out-of-scope document.
    const content = await contentRepository.findByIdScoped(contentId, user, 'Content');
    const existing = (content.gallery ?? []) as unknown as Array<Record<string, unknown>>;
    const known = new Set(existing.map((item) => String(item.url)));

    const additions = images
      .filter((image) => !known.has(image.storageUrl))
      .map((image, index) => ({
        url: image.storageUrl,
        caption: image.title,
        alt: image.alt ?? image.title ?? '',
        order: existing.length + index,
        isCover: false,
      }));

    if (additions.length === 0) return;

    await contentRepository.updateById(contentId, {
      gallery: [...existing, ...additions],
    });
  }

  async storageStats(user: AuthUser) {
    const match = mediaRepository.buildFilter(user, {});
    return mediaRepository.storageBreakdown(match as Record<string, unknown>);
  }

  /** Public media (gallery widget on the public site). */
  async listPublic(query: Record<string, unknown>): Promise<CrudListResult<MediaDocument>> {
    const filter: Record<string, unknown> = {};
    const category = readEnum(query.category, Object.values(MEDIA_CATEGORY));
    if (category) filter.category = category;
    return mediaRepository.list(null, { ...query, limit: query.limit ?? 40 }, filter);
  }
}

export const mediaService = new MediaService();
