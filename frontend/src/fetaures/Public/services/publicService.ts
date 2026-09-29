import apiClient, { getList, unwrap } from '../../../services/api/apiClient';
import type {
  Announcement,
  Community,
  ContentRecord,
  District,
  EventRecord,
  Organization,
  Unit,
} from '../../../types';

/** Public gallery image returned by `GET /content/public/gallery`. */
export interface GalleryImage {
  url: string;
  caption?: string;
  alt?: string;
}

/* All public endpoints are unauthenticated and only expose published records. */

export const fetchOrganizationPublic = async (): Promise<Organization> =>
  unwrap(await apiClient.get<{ data: Organization }>('/organization/public'));

export const fetchDistrictPublic = async (): Promise<District> =>
  unwrap(await apiClient.get<{ data: District }>('/districts/public'));

export const fetchUnitsPublic = (params?: Record<string, unknown>) =>
  getList<Unit>('/units/public', params);

export const fetchCommunitiesPublic = (params?: Record<string, unknown>) =>
  getList<Community>('/communities/public', params);

export const fetchEventsPublic = (params?: Record<string, unknown>) =>
  getList<EventRecord>('/events/public', params);

export const fetchAnnouncementsPublic = (params?: Record<string, unknown>) =>
  getList<Announcement>('/announcements/public', params);

export const fetchContentPublic = (params?: Record<string, unknown>) =>
  getList<ContentRecord>('/content/public', params);

export const fetchContentBySlug = async (slug: string): Promise<ContentRecord> =>
  unwrap(await apiClient.get<{ data: ContentRecord }>(`/content/public/${slug}`));

export const fetchGalleryPublic = async (limit = 60): Promise<GalleryImage[]> =>
  unwrap(await apiClient.get<{ data: GalleryImage[] }>('/content/public/gallery', { params: { limit } }));

export const fetchPublicEventById = async (id: string): Promise<EventRecord> =>
  unwrap(await apiClient.get<{ data: EventRecord }>(`/events/public/${id}`));

export const fetchPublicAnnouncementById = async (id: string): Promise<Announcement> =>
  unwrap(await apiClient.get<{ data: Announcement }>(`/announcements/public/${id}`));

/**
 * Public contact form submission. The endpoint is unauthenticated and rate
 * limited per IP; it returns only a reference id, never the stored record.
 */
export const submitContactMessage = async (payload: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  /** Honeypot: must stay empty for a genuine submission. */
  website?: string;
}): Promise<{ reference: string }> =>
  unwrap(
    await apiClient.post<{ data: { reference: string } }>('/contact-messages', {
      ...payload,
      website: payload.website ?? '',
    }),
  );
