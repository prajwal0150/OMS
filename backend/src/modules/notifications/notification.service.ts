import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../../constants/enums';
import type { NotificationType } from '../../constants/enums';
import { userRepository } from '../users/user.repository';
import { notificationRepository } from './notification.repository';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  entity?: string;
  entityId?: string;
  district?: string | null;
  unit?: string | null;
  community?: string | null;
  createdBy?: string;
}

/** Fan out notifications to individual users or to a whole organizational scope. */
export class NotificationService {
  async notifyUsers(recipientIds: string[], input: NotificationInput): Promise<number> {
    const unique = Array.from(new Set(recipientIds.filter(Boolean)));
    const entries = unique.map((recipient) => ({
      recipient,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      entity: input.entity,
      entityId: input.entityId,
      district: input.district ?? undefined,
      unit: input.unit ?? undefined,
      community: input.community ?? undefined,
      createdBy: input.createdBy,
      isRead: false,
    }));
    return notificationRepository.insertNotifications(entries);
  }

  /** Notifies every active account that matches the organizational scope. */
  async notifyScope(
    filter: { district?: string | null; unit?: string | null; community?: string | null },
    input: NotificationInput,
  ): Promise<number> {
    const recipients = await userRepository.list(null, { limit: 500 }, {
      status: 'ACTIVE',
      ...(filter.district ? { district: filter.district } : {}),
      ...(filter.unit ? { unit: filter.unit } : {}),
    });
    return this.notifyUsers(
      recipients.items.map((user) => String(user._id)),
      input,
    );
  }

  async list(recipientId: string, query: Record<string, unknown>) {
    const filter: Record<string, unknown> = { recipient: recipientId };
    if (query.isRead !== undefined) {
      filter.isRead = String(query.isRead) === 'true';
    }
    if (typeof query.type === 'string' && query.type) filter.type = query.type;
    return notificationRepository.list(null, query, filter);
  }

  async unreadCount(recipientId: string): Promise<number> {
    return notificationRepository.unreadCount(recipientId);
  }

  async markRead(recipientId: string, notificationId: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(notificationId)) return false;
    return notificationRepository.markRead(recipientId, notificationId);
  }

  async markAllRead(recipientId: string): Promise<number> {
    return notificationRepository.markAllRead(recipientId);
  }

  async remove(recipientId: string, notificationId: string): Promise<void> {
    await notificationRepository.deleteById(notificationId);
    void recipientId;
  }

  /** Convenience helpers used by other services. */
  async contentSubmitted(title: string, contentId: string, recipientIds: string[], actorId: string) {
    return this.notifyUsers(recipientIds, {
      type: NOTIFICATION_TYPE.CONTENT_APPROVAL,
      title: 'Content awaiting review',
      message: `"${title}" has been submitted for review.`,
      link: `/admin/content/${contentId}`,
      entity: 'Content',
      entityId: contentId,
      createdBy: actorId,
    });
  }

  async contentPublished(
    title: string,
    contentId: string,
    recipientIds: string[],
    actorId: string,
  ) {
    return this.notifyUsers(recipientIds, {
      type: NOTIFICATION_TYPE.CONTENT_PUBLISHED,
      title: 'Content published',
      message: `"${title}" is now published.`,
      link: `/content/${contentId}`,
      entity: 'Content',
      entityId: contentId,
      createdBy: actorId,
    });
  }
}

export const notificationService = new NotificationService();
