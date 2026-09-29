import {
  CONTENT_STATUS,
  CONTENT_TYPE,
  VISIBILITY,
} from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { slugify, sanitizeRichText, stripHtml, truncate } from '../../utils/strings';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { buildDateRange, combineFilters, readEnum } from '../../shared/queryFilters';
import type { AuthUser } from '../../types/auth';
import { contentRepository } from './content.repository';
import type { ContentDocument } from './content.model';
import { memberRepository } from '../members/member.repository';

export class ContentService extends ScopedCrudService<ContentDocument> {
  constructor() {
    super({
      entityLabel: 'Content',
      auditEntity: 'Content',
      repository: contentRepository,
      buildListFilter: (query) =>
        combineFilters(
          readEnum(query.contentType, Object.values(CONTENT_TYPE))
            ? { contentType: query.contentType }
            : {},
          readEnum(query.status, Object.values(CONTENT_STATUS)) ? { status: query.status } : {},
          readEnum(query.visibility, Object.values(VISIBILITY))
            ? { visibility: query.visibility }
            : {},
          typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {},
          typeof query.community === 'string' && query.community
            ? { community: query.community }
            : {},
          typeof query.committee === 'string' && query.committee
            ? { committee: query.committee }
            : {},
          typeof query.event === 'string' && query.event ? { event: query.event } : {},
          typeof query.author === 'string' && query.author ? { author: query.author } : {},
          Object.keys(buildDateRange(query.from, query.to, { endOfDay: true })).length > 0
            ? { publishedAt: buildDateRange(query.from, query.to, { endOfDay: true }) }
            : {},
        ) as Record<string, unknown>,
      prepareCreate: async (user, payload) => {
        const districtId = String(payload.district ?? user.district ?? '');
        if (!districtId) throw ApiError.badRequest('A district is required to create content');
        const title = String(payload.title ?? '').trim();
        if (title.length < 3) throw ApiError.badRequest('A content title is required');

        const html = sanitizeRichText(String(payload.content ?? ''));
        return {
          ...payload,
          title,
          content: html,
          summary: payload.summary ?? truncate(stripHtml(html), 300),
          slug: await this.uniqueSlug(title),
          district: districtId,
          author: user.id,
          createdBy: user.id,
          status: payload.status ?? CONTENT_STATUS.DRAFT,
          gallery: this.normalizeGallery(payload.gallery),
          videos: payload.videos ?? [],
        };
      },
      prepareUpdate: async (_user, existing, payload) => {
        const next: Record<string, unknown> = { ...payload };
        if (typeof payload.title === 'string' && payload.title.trim() !== existing.title) {
          next.slug = await this.uniqueSlug(payload.title.trim(), String(existing._id));
        }
        if (typeof payload.content === 'string') {
          next.content = sanitizeRichText(payload.content);
          if (!payload.summary) next.summary = truncate(stripHtml(next.content as string), 300);
        }
        if (payload.gallery !== undefined) next.gallery = this.normalizeGallery(payload.gallery);
        // Status transitions are only possible through the publishing workflow.
        delete next.status;
        return next;
      },
    });
  }

  private normalizeGallery(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.map((item, index) => {
      const entry = item as Record<string, unknown>;
      return {
        url: String(entry.url ?? ''),
        caption: entry.caption ? String(entry.caption) : undefined,
        alt: entry.alt ? String(entry.alt) : undefined,
        order: typeof entry.order === 'number' ? entry.order : index,
        isCover: Boolean(entry.isCover),
      };
    });
  }

  private async uniqueSlug(title: string, ignoreId?: string): Promise<string> {
    const base = slugify(title) || `content-${Date.now()}`;
    let candidate = base;
    let suffix = 1;
    // Slugs are unique per deployment; collisions get a numeric suffix.
    for (;;) {
      const existing = await contentRepository.findBySlug(candidate);
      if (!existing || (ignoreId && String(existing._id) === ignoreId)) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  /** Public website listing: only published, publicly visible content. */
  async listPublic(query: Record<string, unknown>) {
    return contentRepository.list(null, query, {
      status: CONTENT_STATUS.PUBLISHED,
      visibility: VISIBILITY.PUBLIC,
      publishedAt: { $lte: new Date() },
    });
  }

  /** Public content detail by slug, including related content. */
  async getPublicBySlug(slug: string) {
    const content = await contentRepository.findOne({
      slug,
      status: CONTENT_STATUS.PUBLISHED,
      visibility: VISIBILITY.PUBLIC,
      publishedAt: { $lte: new Date() },
    });
    if (!content) throw ApiError.notFound('Content not found');
    await contentRepository.incrementViews(slug);

    const related = await contentRepository.list(null, { limit: 3 }, {
      status: CONTENT_STATUS.PUBLISHED,
      visibility: VISIBILITY.PUBLIC,
      contentType: content.contentType,
      _id: { $ne: content._id },
    });

    return { ...(content as unknown as Record<string, unknown>), related: related.items };
  }

  /** Public gallery: gallery images of published public content. */
  async publicGallery(query: Record<string, unknown>) {
    const limit = Number(query.limit ?? 60);
    return contentRepository.galleryItems(
      { status: CONTENT_STATUS.PUBLISHED, visibility: VISIBILITY.PUBLIC },
      limit,
    );
  }

  /** Content visible to a signed in member, honouring visibility rules. */
  async listForMember(user: AuthUser, query: Record<string, unknown>) {
    if (!user.member) throw ApiError.forbidden('No member profile linked to this account');
    const member = await memberRepository.findByIdScoped(user.member, user, 'Member');
    const scopeConditions: Record<string, unknown>[] = [
      { visibility: { $in: [VISIBILITY.PUBLIC, VISIBILITY.MEMBERS_ONLY] } },
    ];
    if (member.district) scopeConditions.push({ visibility: VISIBILITY.DISTRICT_ONLY, district: member.district });
    if (member.unit) scopeConditions.push({ visibility: VISIBILITY.UNIT_ONLY, unit: member.unit });
    if (member.communities?.length) {
      scopeConditions.push({
        visibility: VISIBILITY.COMMUNITY_ONLY,
        community: { $in: member.communities },
      });
    }

    return contentRepository.list(user, query, {
      status: CONTENT_STATUS.PUBLISHED,
      $or: scopeConditions,
    } as Record<string, unknown>);
  }

  async statusBreakdown(user: AuthUser) {
    const match = contentRepository.buildFilter(user, {});
    return contentRepository.countByStatus(match as Record<string, unknown>);
  }

  async typeBreakdown(user: AuthUser) {
    const match = contentRepository.buildFilter(user, {});
    return contentRepository.countByType(match as Record<string, unknown>);
  }

  async monthly(user: AuthUser, months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    const match = contentRepository.buildFilter(user, {});
    return contentRepository.monthlyCounts(match as Record<string, unknown>, since);
  }

  /** Content report rows (title, publisher, scope, status). */
  async report(user: AuthUser, query: Record<string, unknown>, limit = 200) {
    const filter = this.options.buildListFilter ? this.options.buildListFilter(query) : {};
    const { items } = await contentRepository.list(user, { ...query, limit }, filter);
    const statusBreakdown = await this.statusBreakdown(user);
    return {
      summary: statusBreakdown,
      rows: items.map((content) => ({
        title: content.title,
        type: content.contentType,
        status: content.status,
        visibility: content.visibility,
        publishedBy:
          [
            (content.publishedBy as unknown as { firstName?: string } | undefined)?.firstName,
            (content.publishedBy as unknown as { lastName?: string } | undefined)?.lastName,
          ]
            .filter(Boolean)
            .join(' ') || '—',
        district: (content.district as unknown as { name?: string } | undefined)?.name ?? '—',
        unit: (content.unit as unknown as { name?: string } | undefined)?.name ?? '—',
        community: (content.community as unknown as { name?: string } | undefined)?.name ?? '—',
        date: content.publishedAt
          ? new Date(content.publishedAt).toISOString().slice(0, 10)
          : '—',
        views: content.views ?? 0,
      })),
    };
  }
}

export const contentService = new ContentService();
