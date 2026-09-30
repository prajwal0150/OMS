import apiClient, { getList, unwrap } from '../../../../../services/api/apiClient';
import type { MediaItem, MediaCategory, PaginatedResult } from '../../../../../types';

export const fetchMedia = async (params?: Record<string, unknown>): Promise<PaginatedResult<MediaItem>> =>
  getList<MediaItem>('/media', params);

export const fetchPublicMedia = async (params?: Record<string, unknown>): Promise<PaginatedResult<MediaItem>> =>
  getList<MediaItem>('/media/public', params);

export const fetchMediaById = async (id: string): Promise<MediaItem> =>
  unwrap(await apiClient.get<{ data: MediaItem }>(`/media/${id}`));

/** Uploads one or more files; returns the created media records. */
export const uploadMedia = async (
  files: File[],
  metadata: {
    title?: string;
    alt?: string;
    caption?: string;
    category?: MediaCategory;
    tags?: string[];
  } = {},
): Promise<MediaItem[]> => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  if (metadata.title) form.append('title', metadata.title);
  if (metadata.alt) form.append('alt', metadata.alt);
  if (metadata.caption) form.append('caption', metadata.caption);
  if (metadata.category) form.append('category', metadata.category);
  if (metadata.tags?.length) form.append('tags', metadata.tags.join(','));

  const response = await apiClient.post<{ data: MediaItem[] }>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const updateMedia = async (id: string, payload: Partial<MediaItem>): Promise<MediaItem> =>
  unwrap(await apiClient.patch<{ data: MediaItem }>(`/media/${id}`, payload));

export const deleteMedia = async (id: string): Promise<void> => {
  await apiClient.delete(`/media/${id}`);
};

export const attachMedia = async (
  mediaIds: string[],
  entity: string,
  entityId: string,
): Promise<{ attached: number }> =>
  unwrap(
    await apiClient.post<{ data: { attached: number } }>('/media/attach', {
      mediaIds,
      entity,
      entityId,
    }),
  );

export interface MediaStorageStats {
  total: number;
  byCategory: Array<{ _id: string; count: number; size: number }>;
}

export const fetchMediaStats = async (): Promise<MediaStorageStats> =>
  unwrap(await apiClient.get<{ data: MediaStorageStats }>('/media/stats'));

export const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const isImage = (item: MediaItem): boolean => item.category === 'IMAGE' || item.fileType.startsWith('image/');
export const isVideo = (item: MediaItem): boolean => item.category === 'VIDEO' || item.fileType.startsWith('video/');
