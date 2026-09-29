import { ContactMessage, type ContactMessageDocument } from './contactMessage.model';
import { BaseRepository } from '../../shared/BaseRepository';
import { CONTACT_STATUS, type ContactStatus } from '../../constants/enums';

/**
 * Contact submissions are district wide rather than organization scoped, so the
 * repository passes `null` as the user to `BaseRepository` and filters itself.
 */
export class ContactMessageRepository extends BaseRepository<ContactMessageDocument> {
  constructor() {
    super(ContactMessage, {
      searchFields: ['name', 'email', 'subject', 'message'],
      allowedSortFields: ['createdAt', 'status', 'name'],
      defaultSort: 'createdAt',
    });
  }

  async countSince(ipAddress: string, since: Date): Promise<number> {
    return ContactMessage.countDocuments({ ipAddress, createdAt: { $gte: since } }).exec();
  }

  async setStatus(
    id: string,
    status: ContactStatus,
    extra: { replyNote?: string; assignedTo?: string } = {},
  ): Promise<ContactMessageDocument | null> {
    const update: Record<string, unknown> = { status };
    if (status === CONTACT_STATUS.READ) update.readAt = new Date();
    if (status === CONTACT_STATUS.REPLIED) update.repliedAt = new Date();
    if (extra.replyNote !== undefined) update.replyNote = extra.replyNote;
    if (extra.assignedTo) update.assignedTo = extra.assignedTo;
    return ContactMessage.findByIdAndUpdate(id, update, { new: true })
      .lean<ContactMessageDocument>()
      .exec();
  }

  async remove(id: string): Promise<void> {
    await ContactMessage.findByIdAndDelete(id).exec();
  }
}

export const contactMessageRepository = new ContactMessageRepository();
