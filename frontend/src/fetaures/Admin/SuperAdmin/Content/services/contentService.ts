import apiClient, { getList, unwrap } from '../../../../../services/api/apiClient';
import type { ContentRecord, ContentStatus, PaginatedResult } from '../../../../../types';

export interface GalleryImageInput {
  url: string;
  caption?: string;
  alt?: string;
  order?: number;
  isCover?: boolean;
}

export interface VideoInput {
  videoType?: string;
  videoUrl: string;
  thumbnail?: string;
  caption?: string;
}

export const fetchContent = async (params?: Record<string, unknown>): Promise<PaginatedResult<ContentRecord>> =>
  getList<ContentRecord>('/content', params);

export const fetchPublicContent = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<ContentRecord>> =>
  getList<ContentRecord>('/content/public', params);

export const fetchPublicContentBySlug = async (slug: string): Promise<ContentRecord> =>
  unwrap(await apiClient.get<{ data: ContentRecord }>(`/content/public/${slug}`));

export const fetchPublicGallery = async (limit = 60): Promise<GalleryImageInput[]> =>
  unwrap(await apiClient.get<{ data: GalleryImageInput[] }>('/content/public/gallery', { params: { limit } }));

export const fetchContentForMember = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<ContentRecord>> =>
  getList<ContentRecord>('/content/mine', params);

export const fetchContentById = async (id: string): Promise<ContentRecord> =>
  unwrap(await apiClient.get<{ data: ContentRecord }>(`/content/${id}`));

export const fetchContentStats = async (): Promise<{
  byStatus: BreakdownLike[];
  byType: BreakdownLike[];
  monthly: Array<{ month: string; count: number }>;
}> =>
  unwrap(
    await apiClient.get<{
      data: {
        byStatus: BreakdownLike[];
        byType: BreakdownLike[];
        monthly: Array<{ month: string; count: number }>;
      };
    }>('/content/stats'),
  );

interface BreakdownLike {
  key: string;
  count: number;
}

export const createContent = async (payload: Partial<ContentRecord>): Promise<ContentRecord> =>
  unwrap(await apiClient.post<{ data: ContentRecord }>('/content', payload));

export const updateContent = async (id: string, payload: Partial<ContentRecord>): Promise<ContentRecord> =>
  unwrap(await apiClient.patch<{ data: ContentRecord }>(`/content/${id}`, payload));

export const deleteContent = async (id: string): Promise<void> => {
  await apiClient.delete(`/content/${id}`);
};

/* ------------------------- Publishing workflow ----------------------- */

export const submitContent = async (id: string, notes?: string): Promise<ContentRecord> =>
  unwrap(await apiClient.post<{ data: ContentRecord }>(`/content/${id}/submit`, { notes }));

export const approveContent = async (id: string, notes?: string): Promise<ContentRecord> =>
  unwrap(await apiClient.post<{ data: ContentRecord }>(`/content/${id}/approve`, { notes }));

export const rejectContent = async (id: string, reason?: string): Promise<ContentRecord> =>
  unwrap(await apiClient.post<{ data: ContentRecord }>(`/content/${id}/reject`, { reason }));

export const publishContent = async (
  id: string,
  options?: { scheduledAt?: string; notes?: string },
): Promise<ContentRecord> => unwrap(await apiClient.post<{ data: ContentRecord }>(`/content/${id}/publish`, options ?? {}));

export const unpublishContent = async (id: string): Promise<ContentRecord> =>
  unwrap(await apiClient.post<{ data: ContentRecord }>(`/content/${id}/unpublish`));

export const archiveContent = async (id: string): Promise<ContentRecord> =>
  unwrap(await apiClient.post<{ data: ContentRecord }>(`/content/${id}/archive`));

/** Statuses that can still move forward through the review pipeline. */
export const nextStatuses = (status: ContentStatus): ContentStatus[] => {
  switch (status) {
    case 'DRAFT':
    case 'REJECTED':
      return ['PENDING_REVIEW'];
    case 'PENDING_REVIEW':
      return ['APPROVED', 'REJECTED'];
    case 'APPROVED':
      return ['PUBLISHED', 'SCHEDULED'];
    case 'PUBLISHED':
      return ['ARCHIVED'];
    default:
      return [];
  }
};
