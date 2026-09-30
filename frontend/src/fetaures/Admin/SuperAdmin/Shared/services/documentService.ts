import apiClient, { getList, unwrap } from '../../../../../services/api/apiClient';
import type { DocumentCategory, DocumentFile, PaginatedResult, Visibility } from '../../../../../types';

export interface UploadDocumentInput {
  title: string;
  description?: string;
  category?: DocumentCategory;
  visibility?: Visibility;
  unit?: string;
  community?: string;
  committee?: string;
  event?: string;
  date?: string;
  tags?: string[];
}

export const fetchDocuments = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<DocumentFile>> =>
  getList<DocumentFile>('/documents', params);

export const fetchPublicDocuments = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<DocumentFile>> =>
  getList<DocumentFile>('/documents/public', params);

export const fetchDocumentsForMember = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<DocumentFile>> =>
  getList<DocumentFile>('/documents/mine', params);

export const fetchDocumentById = async (id: string): Promise<DocumentFile> =>
  unwrap(await apiClient.get<{ data: DocumentFile }>(`/documents/${id}`));

export const uploadDocument = async (file: File, payload: UploadDocumentInput): Promise<DocumentFile> => {
  const form = new FormData();
  form.append('file', file);
  form.append('title', payload.title);
  if (payload.description) form.append('description', payload.description);
  if (payload.category) form.append('category', payload.category);
  if (payload.visibility) form.append('visibility', payload.visibility);
  if (payload.unit) form.append('unit', payload.unit);
  if (payload.community) form.append('community', payload.community);
  if (payload.committee) form.append('committee', payload.committee);
  if (payload.event) form.append('event', payload.event);
  if (payload.date) form.append('date', payload.date);
  if (payload.tags?.length) form.append('tags', payload.tags.join(','));

  const response = await apiClient.post<{ data: DocumentFile }>('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const updateDocument = async (id: string, payload: Partial<DocumentFile>): Promise<DocumentFile> =>
  unwrap(await apiClient.patch<{ data: DocumentFile }>(`/documents/${id}`, payload));

export const deleteDocument = async (id: string): Promise<void> => {
  await apiClient.delete(`/documents/${id}`);
};

/** Records the download server-side, then the browser opens the file URL. */
export const registerDownload = async (id: string): Promise<void> => {
  await apiClient.post(`/documents/${id}/download`);
};

export const fetchDocumentStats = async (): Promise<Array<{ _id: string; count: number }>> =>
  unwrap(await apiClient.get<{ data: Array<{ _id: string; count: number }> }>('/documents/stats'));

export const formatBytes = (bytes?: number): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
