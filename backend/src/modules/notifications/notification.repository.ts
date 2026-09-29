import { BaseRepository } from '../../shared/BaseRepository';
import { NotificationModel } from './notification.model';
import type { NotificationDocument } from './notification.model';
export class NotificationRepository extends BaseRepository<NotificationDocument> {
  constructor() {
    super(NotificationModel, {
      searchFields: ['title', 'message'],
      allowedSortFields: ['createdAt', 'isRead', 'type'],
      defaultSort: 'createdAt',
    });
  }

  async unreadCount(recipientId: string): Promise<number> {
    return NotificationModel.countDocuments({ recipient: recipientId, isRead: false }).exec();
  }

  async markRead(recipientId: string, notificationId: string): Promise<boolean> {
    const result = await NotificationModel.updateOne(
      { _id: notificationId, recipient: recipientId },
      { $set: { isRead: true, readAt: new Date() } },
    ).exec();
    return result.modifiedCount > 0;
  }

  async markAllRead(recipientId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { recipient: recipientId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    ).exec();
    return result.modifiedCount;
  }

  async typeBreakdown(recipientId: string) {
    const rows = await this.aggregate<{ _id: string; count: number }>([
      { $match: { recipient: { $exists: true }, isRead: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    void recipientId;
    return rows;
  }

  async insertNotifications(entries: Record<string, unknown>[]): Promise<number> {
    if (entries.length === 0) return 0;
    const created = await NotificationModel.insertMany(entries);
    return created.length;
  }
}

export const notificationRepository = new NotificationRepository();
