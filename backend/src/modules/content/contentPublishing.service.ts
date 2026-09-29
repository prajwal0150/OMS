import type { Request } from 'express';
import { AUDIT_ACTION, CONTENT_STATUS, NOTIFICATION_TYPE } from '../../constants/enums';
import { ROLE_NAMES } from '../../constants/roles';
import { ApiError } from '../../utils/ApiError';
import type { AuthUser } from '../../types/auth';
import { contentRepository } from './content.repository';
import { refId, refIdOrNull } from '../../utils/strings';
import type { ContentDocument } from './content.model';
import { auditLogService } from '../auditLogs/auditLog.service';
import { notificationService } from '../notifications/notification.service';
import { userRepository } from '../users/user.repository';

/** Allowed transitions of the content publishing workflow. */
const TRANSITIONS: Record<string, string[]> = {
  SUBMIT: [CONTENT_STATUS.DRAFT, CONTENT_STATUS.REJECTED],
  APPROVE: [CONTENT_STATUS.PENDING_REVIEW],
  REJECT: [CONTENT_STATUS.PENDING_REVIEW],
  PUBLISH: [CONTENT_STATUS.DRAFT, CONTENT_STATUS.APPROVED, CONTENT_STATUS.SCHEDULED, CONTENT_STATUS.PUBLISHED],
  SCHEDULE: [CONTENT_STATUS.APPROVED, CONTENT_STATUS.DRAFT],
  UNPUBLISH: [CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.SCHEDULED],
  ARCHIVE: [CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.DRAFT, CONTENT_STATUS.REJECTED, CONTENT_STATUS.APPROVED],
};

/**
 * Content workflow: Draft â†’ Pending review â†’ Approved â†’ Published.
 * Administrators holding `content.publish` may publish directly.
 */
export class ContentPublishingService {
  private async load(user: AuthUser, id: string): Promise<ContentDocument> {
    return contentRepository.findByIdScoped(id, user, 'Content');
  }

  private assertTransition(action: keyof typeof TRANSITIONS, current: string): void {
    const allowed = TRANSITIONS[action];
    if (!allowed.includes(current)) {
      throw ApiError.conflict(
        `Cannot ${action.toLowerCase()} content in status ${current}. Allowed from: ${allowed.join(', ')}`,
      );
    }
  }

  private async reviewersInScope(content: ContentDocument): Promise<string[]> {
    const reviewers = await userRepository.list(null, { limit: 200 }, {
      status: 'ACTIVE',
      role: { $in: [ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.DISTRICT_ADMIN] },
      ...(content.district ? { district: content.district } : {}),
    });
    return reviewers.items.map((user) => String(user._id));
  }

  async submit(user: AuthUser, id: string, req?: Request) {
    const content = await this.load(user, id);
    this.assertTransition('SUBMIT', content.status);

    await contentRepository.updateById(id, {
      status: CONTENT_STATUS.PENDING_REVIEW,
      reviewNotes: undefined,
      rejectionReason: undefined,
      updatedBy: user.id,
    });

    const reviewers = await this.reviewersInScope(content);
    await notificationService.contentSubmitted(content.title, id, reviewers, user.id);
    await auditLogService.record({
      action: AUDIT_ACTION.SUBMIT,
      entity: 'Content',
      entityId: id,
      description: `Content "${content.title}" submitted for review`,
      user,
      request: req,
    });
    return contentRepository.findById(id);
  }

  async approve(user: AuthUser, id: string, notes?: string, req?: Request) {
    const content = await this.load(user, id);
    this.assertTransition('APPROVE', content.status);
    const updated = await contentRepository.updateById(id, {
      status: CONTENT_STATUS.APPROVED,
      approvedBy: user.id,
      reviewNotes: notes,
      updatedBy: user.id,
    });
    await auditLogService.record({
      action: AUDIT_ACTION.APPROVE,
      entity: 'Content',
      entityId: id,
      description: `Content "${content.title}" approved`,
      user,
      request: req,
    });
    if (content.author) {
      await notificationService.notifyUsers([refId(content.author) as string], {
        type: NOTIFICATION_TYPE.CONTENT_APPROVAL,
        title: 'Content approved',
        message: `"${content.title}" was approved and can be published.`,
        link: `/admin/content/${id}`,
        entity: 'Content',
        entityId: id,
        createdBy: user.id,
      });
    }
    return updated;
  }

  async reject(user: AuthUser, id: string, reason: string, req?: Request) {
    const content = await this.load(user, id);
    this.assertTransition('REJECT', content.status);
    const updated = await contentRepository.updateById(id, {
      status: CONTENT_STATUS.REJECTED,
      rejectionReason: reason,
      approvedBy: user.id,
      updatedBy: user.id,
    });
    await auditLogService.record({
      action: AUDIT_ACTION.REJECT,
      entity: 'Content',
      entityId: id,
      description: `Content "${content.title}" rejected: ${reason}`,
      user,
      request: req,
    });
    if (content.author) {
      await notificationService.notifyUsers([refId(content.author) as string], {
        type: NOTIFICATION_TYPE.CONTENT_APPROVAL,
        title: 'Content rejected',
        message: `"${content.title}" was rejected: ${reason}`,
        link: `/admin/content/${id}`,
        entity: 'Content',
        entityId: id,
        createdBy: user.id,
      });
    }
    return updated;
  }

  async publish(
    user: AuthUser,
    id: string,
    options: { scheduledAt?: Date; notes?: string } = {},
    req?: Request,
  ) {
    const content = await this.load(user, id);
    const scheduledAt = options.scheduledAt;
    const isFuture = scheduledAt && scheduledAt.getTime() > Date.now();
    this.assertTransition(isFuture ? 'SCHEDULE' : 'PUBLISH', content.status);

    const updated = await contentRepository.updateById(id, {
      status: isFuture ? CONTENT_STATUS.SCHEDULED : CONTENT_STATUS.PUBLISHED,
      scheduledAt: scheduledAt ?? undefined,
      publishedAt: isFuture ? undefined : new Date(),
      publishedBy: user.id,
      reviewNotes: options.notes,
      updatedBy: user.id,
    });

    await auditLogService.record({
      action: isFuture ? AUDIT_ACTION.SCHEDULE : AUDIT_ACTION.PUBLISH,
      entity: 'Content',
      entityId: id,
      description: isFuture
        ? `Content "${content.title}" scheduled for ${scheduledAt?.toISOString()}`
        : `Content "${content.title}" published`,
      user,
      request: req,
    });

    if (!isFuture) await this.notifyPublishAudience(content, id, user.id);
    return updated;
  }

  private async notifyPublishAudience(
    content: ContentDocument,
    id: string,
    actorId: string,
  ): Promise<void> {
    await notificationService.notifyScope(
      {
        district: refIdOrNull(content.district),
        unit: refIdOrNull(content.unit),
        community: refIdOrNull(content.community),
      },
      {
        type: NOTIFICATION_TYPE.CONTENT_PUBLISHED,
        title: 'New content published',
        message: `"${content.title}" has been published.`,
        link: `/content/${content.slug}`,
        entity: 'Content',
        entityId: id,
        createdBy: actorId,
      },
    );
  }

  /** Flips scheduled content to published once its scheduled time has passed. */
  async publishDueContent(): Promise<number> {
    const due = await contentRepository.list(null, { limit: 100 }, {
      status: CONTENT_STATUS.SCHEDULED,
      scheduledAt: { $lte: new Date() },
    } as Record<string, unknown>);

    let published = 0;
    for (const content of due.items) {
      await contentRepository.updateById(String(content._id), {
        status: CONTENT_STATUS.PUBLISHED,
        publishedAt: content.scheduledAt ?? new Date(),
      });
      published += 1;
    }
    return published;
  }

  async unpublish(user: AuthUser, id: string, req?: Request) {
    const content = await this.load(user, id);
    this.assertTransition('UNPUBLISH', content.status);
    const updated = await contentRepository.updateById(id, {
      status: CONTENT_STATUS.DRAFT,
      publishedAt: undefined,
      scheduledAt: undefined,
      updatedBy: user.id,
    });
    await auditLogService.record({
      action: AUDIT_ACTION.UNPUBLISH,
      entity: 'Content',
      entityId: id,
      description: `Content "${content.title}" unpublished`,
      user,
      request: req,
    });
    return updated;
  }

  async archive(user: AuthUser, id: string, req?: Request) {
    const content = await this.load(user, id);
    this.assertTransition('ARCHIVE', content.status);
    const updated = await contentRepository.updateById(id, {
      status: CONTENT_STATUS.ARCHIVED,
      updatedBy: user.id,
    });
    await auditLogService.record({
      action: AUDIT_ACTION.UPDATE,
      entity: 'Content',
      entityId: id,
      description: `Content "${content.title}" archived`,
      user,
      request: req,
    });
    return updated;
  }
}

export const contentPublishingService = new ContentPublishingService();
