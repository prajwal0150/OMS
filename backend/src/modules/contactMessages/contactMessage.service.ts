import { contactMessageRepository } from './contactMessage.repository';
import type { ContactMessageDocument } from './contactMessage.model';
import { ApiError } from '../../utils/ApiError';
import { notificationService } from '../notifications/notification.service';
import type {
  CreateContactMessageInput,
  UpdateContactMessageInput,
} from './contactMessage.validation';
import type { ContactStatus } from '../../constants/enums';

/** Per-IP submission cap, applied before anything is written. */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export class ContactMessageService {
  /**
   * Stores a public contact page submission. The message is persisted first, so
   * a failed notification never loses an enquiry. The caller receives only a
   * reference id - the raw row is never echoed back to an anonymous visitor.
   */
  async submit(
    input: CreateContactMessageInput,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<{ reference: string }> {
    if (input.website) {
      // Honeypot tripped. Return success so the bot does not learn anything.
      return { reference: 'HPS-000000' };
    }

    if (meta.ipAddress) {
      const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
      const recent = await contactMessageRepository.countSince(meta.ipAddress, since);
      if (recent >= RATE_LIMIT_MAX) {
        throw ApiError.tooManyRequests(
          'Too many messages have been sent from this connection. Please try again later.',
        );
      }
    }

    const created = await contactMessageRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone || undefined,
      subject: input.subject,
      message: input.message,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    // Best effort: an admin may still find the message in the inbox list.
    void this.notifyInbox(created).catch(() => undefined);

    return { reference: this.referenceFor(created) };
  }

  private referenceFor(document: ContactMessageDocument): string {
    return `HPS-${String(document._id).slice(-6).toUpperCase()}`;
  }

  private async notifyInbox(document: ContactMessageDocument): Promise<void> {
    // District level administrators receive the enquiry. `notifyScope` only
    // returns ACTIVE accounts that are already in the district.
    await notificationService.notifyScope(
      { district: this.config.districtId },
      {
        type: 'CONTACT_MESSAGE',
        title: `New contact message: ${document.subject}`,
        message: `${document.name} (${document.email}) sent a message through the public site.`,
        link: `/admin/contact-messages`,
      },
    );
  }

  /** Runtime configuration, injected by the settings module. */
  private readonly config: { districtId?: string | null } = { districtId: null };

  async list(query: Record<string, unknown>) {
    const { status } = query as { status?: ContactStatus };
    return contactMessageRepository.list(null, query, status ? { status } : {});
  }

  async get(id: string): Promise<ContactMessageDocument> {
    const found = await contactMessageRepository.findById(id);
    if (!found) throw ApiError.notFound('Contact message not found');
    return found;
  }

  async update(
    id: string,
    input: UpdateContactMessageInput,
  ): Promise<ContactMessageDocument> {
    if (!input.status && input.replyNote === undefined) {
      throw ApiError.badRequest('Nothing to update');
    }
    const updated = await contactMessageRepository.setStatus(
      id,
      (input.status ?? 'READ') as ContactStatus,
      { replyNote: input.replyNote },
    );
    if (!updated) throw ApiError.notFound('Contact message not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await contactMessageRepository.remove(id);
  }
}

export const contactMessageService = new ContactMessageService();
