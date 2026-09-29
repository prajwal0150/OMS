import apiClient, { tokenStorage } from './apiClient';

/**
 * Downloads a binary report (PDF / Excel / CSV) through the authenticated API
 * client and triggers a browser save. Used by the Reports module.
 */
export const downloadReport = async (
  path: string,
  payload: Record<string, unknown>,
  method: 'post' | 'get' = 'post',
): Promise<void> => {
  const response = await apiClient.request({
    url: path,
    method,
    data: method === 'post' ? payload : undefined,
    params: method === 'get' ? payload : undefined,
    responseType: 'blob',
  });

  const blob = response.data as Blob;
  const filename = readFilename(response.headers['content-disposition']);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const readFilename = (header: unknown): string => {
  if (typeof header !== 'string') return 'report';
  const match = /filename="?([^";]+)"?/.exec(header);
  return match?.[1] ?? 'report';
};

/** Resolves a stored upload path to an absolute, publicly reachable URL. */
export const resolveAssetUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
  // Uploaded assets are served from the API origin, not under the /api prefix.
  const origin = base.startsWith('http') ? base.replace(/\/api\/?$/, '') : '';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

export const hasToken = (): boolean => Boolean(tokenStorage.getAccess());
