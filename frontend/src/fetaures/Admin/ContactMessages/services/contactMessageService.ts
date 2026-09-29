import apiClient, { getList, unwrap } from '../../../../services/api/apiClient';
import type { ContactMessage } from '../../../../types';

/** Admin inbox for public contact page submissions. */
export const fetchContactMessages = (
  params?: Record<string, unknown>,
): Promise<{ items: ContactMessage[]; meta?: Awaited<ReturnType<typeof getList<ContactMessage>>>['meta'] }> =>
  getList<ContactMessage>('/contact-messages', params);

export const fetchContactMessage = async (id: string): Promise<ContactMessage> =>
  unwrap(await apiClient.get<{ data: ContactMessage }>(`/contact-messages/${id}`));

export const updateContactMessage = async (
  id: string,
  payload: { status?: string; replyNote?: string },
): Promise<ContactMessage> =>
  unwrap(
    await apiClient.patch<{ data: ContactMessage }>(`/contact-messages/${id}`, payload),
  );

export const deleteContactMessage = async (id: string): Promise<void> => {
  await apiClient.delete(`/contact-messages/${id}`);
};
