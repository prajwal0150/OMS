import { NOTIFICATION_TYPE, RECORD_STATUS, TARGET_TYPE } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { sanitizeRichText, stripHtml, truncate } from '../../utils/strings';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { buildDateRange, combineFilters, readEnum } from '../../shared/queryFilters';
import type { AuthUser } from '../../types/auth';
import { announcementRepository } from './announcement.repository';
import type { AnnouncementDocument } from './announcement.model';
import { memberRepository } from '../members/member.repository';
import { notificationService } from '../notifications/notification.service';

export class AnnouncementService extends ScopedCrudService<AnnouncementDocument> {
  constructor() {
    super({
      entityLabel: 'Announcement',
      auditEntity: 'Announcement',
      repository: announcementRepository,
      buildListFilter: (query) =>
        combineFilters(
          readEnum(query.targetType, Object.values(TARGET_TYPE))
            ? { targetType: query.targetType }
            : {},
          readEnum(query.status, Object.values(RECORD_STATUS)) ? { status: query.status } : {},
          typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {},
          typeof query.community === 'string' && query.community
            ? { community: query.community }
            : {},
          typeof query.committee === 'string' && query.committee
            ? { committee: query.committee }
            : {},
          Object.keys(buildDateRange(query.from, query.to, { endOfDay: true })).length > 0
            ? { publishDate: buildDateRange(query.from, query.to, { endOfDay: true }) }
            : {},
        ) as Record<string, unknown>,
      prepareCreate: async (user, payload) => {
        const targetType = String(payload.targetType ?? TARGET_TYPE.DISTRICT);
        const districtId = payload.district ?? user.district;
        if (targetType === TARGET_TYPE.DISTRICT && !districtId) {
          throw ApiError.badRequest('A district is required for a district announcement');
        }
        if (targetType === TARGET_TYPE.UNIT && !payload.unit) {
          throw ApiError.badRequest('A unit is required for a unit announcement');
        }
        if (targetType === TARGET_TYPE.COMMUNITY && !payload.community) {
          throw ApiError.badRequest('A community is required for a community announcement');
        }
        if (targetType === TARGET_TYPE.COMMITTEE && !payload.committee) {
          throw ApiError.badRequest('A committee is required for a committee announcement');
        }

        const selectedMembers = Array.isArray(payload.selectedMembers)
          ? (payload.selectedMembers as unknown[]).map(String)
          : [];
        for (const memberId of selectedMembers) {
          await memberRepository.findByIdScoped(memberId, user, 'Member');
        }

        return {
          ...payload,
          title: String(payload.title ?? '').trim(),
          content: sanitizeRichText(String(payload.content ?? '')),
          district: districtId,
          targetType,
          selectedMembers,
          publishDate: payload.publishDate ?? new Date(),
          createdBy: user.id,
        };
      },
      prepareUpdate: async (_user, _existing, payload) => ({
        ...payload,
        ...(typeof payload.content === 'string'
          ? { content: sanitizeRichText(payload.content) }
          : {}),
      }),
    });
  }

  async create(user: AuthUser, payload: Record<string, unknown>) {
    const announcement = await super.create(user, payload);
    await this.dispatchNotifications(user, announcement);
    return announcement;
  }

  /** Fan out an announcement notification to the targeted organizational scope. */
  private async dispatchNotifications(
    user: AuthUser,
    announcement: Record<string, unknown>,
  ): Promise<void> {
    const doc = announcement as unknown as AnnouncementDocument;
    await notificationService.notifyScope(
      {
        district: doc.district ? String(doc.district) : null,
        unit: doc.unit ? String(doc.unit) : null,
        community: doc.community ? String(doc.community) : null,
      },
      {
        type: NOTIFICATION_TYPE.ANNOUNCEMENT,
        title: 'New announcement',
        message: truncate(stripHtml(String(doc.content ?? '')), 160),
        link: `/announcements/${String(doc._id)}`,
        entity: 'Announcement',
        entityId: String(doc._id),
        createdBy: user.id,
      },
    );
  }

  /** Public announcements for the public website. */
  async listPublic(query: Record<string, unknown>) {
    return announcementRepository.list(null, query, {
      isPublic: true,
      status: RECORD_STATUS.ACTIVE,
      ...announcementRepository.filterActive(),
    } as Record<string, unknown>);
  }

  async getPublicById(id: string) {
    const announcement = await announcementRepository.findById(id);
    if (!announcement || !announcement.isPublic) throw ApiError.notFound('Announcement not found');
    return announcement;
  }

  /** Announcements relevant to a member: scope targeted plus selected members. */
  async listForMember(user: AuthUser, query: Record<string, unknown>) {
    if (!user.member) throw ApiError.forbidden('No member profile linked to this account');
    const member = await memberRepository.findByIdScoped(user.member, user, 'Member');
    const conditions: Record<string, unknown>[] = [
      { targetType: TARGET_TYPE.DISTRICT, district: member.district },
      { targetType: TARGET_TYPE.SELECTED_MEMBERS, selectedMembers: member._id },
    ];
    if (member.unit) conditions.push({ targetType: TARGET_TYPE.UNIT, unit: member.unit });
    if (member.communities?.length) {
      conditions.push({
        targetType: TARGET_TYPE.COMMUNITY,
        community: { $in: member.communities },
      });
    }

    return announcementRepository.list(user, query, {
      status: RECORD_STATUS.ACTIVE,
      $or: conditions,
    } as Record<string, unknown>);
  }

  async monthly(user: AuthUser, months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    const match = announcementRepository.buildFilter(user, {});
    return announcementRepository.countByMonth(match as Record<string, unknown>, since);
  }

  async report(user: AuthUser, query: Record<string, unknown>, limit = 200) {
    const filter = this.options.buildListFilter ? this.options.buildListFilter(query) : {};
    const { items } = await announcementRepository.list(user, { ...query, limit }, filter);
    return {
      rows: items.map((announcement) => ({
        title: announcement.title,
        targetType: announcement.targetType,
        unit: (announcement.unit as unknown as { name?: string } | undefined)?.name ?? '—',
        community:
          (announcement.community as unknown as { name?: string } | undefined)?.name ?? '—',
        publishDate: new Date(announcement.publishDate).toISOString().slice(0, 10),
        expiryDate: announcement.expiryDate
          ? new Date(announcement.expiryDate).toISOString().slice(0, 10)
          : '—',
        status: announcement.status,
        audience: announcement.isPublic ? 'Public' : 'Members',
      })),
    };
  }
}

export const announcementService = new AnnouncementService();
