import { DOCUMENT_CATEGORY, VISIBILITY } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { buildDateRange, combineFilters, readEnum } from '../../shared/queryFilters';
import { getStorageProvider } from '../../services/storage';
import type { AuthUser } from '../../types/auth';
import { documentRepository } from './document.repository';
import type { DocumentFileDocument } from './document.model';
import { memberRepository } from '../members/member.repository';
import type { StoredFile } from '../../services/storage/StorageProvider';

export interface DocumentMetadata {
  title?: string;
  description?: string;
  category?: string;
  visibility?: string;
  unit?: string;
  community?: string;
  committee?: string;
  event?: string;
  tags?: string[];
  date?: string;
}

export class DocumentService extends ScopedCrudService<DocumentFileDocument> {
  constructor() {
    super({
      entityLabel: 'Document',
      auditEntity: 'Document',
      repository: documentRepository,
      buildListFilter: (query) =>
        combineFilters(
          readEnum(query.category, Object.values(DOCUMENT_CATEGORY))
            ? { category: query.category }
            : {},
          readEnum(query.visibility, Object.values(VISIBILITY))
            ? { visibility: query.visibility }
            : {},
          typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {},
          typeof query.community === 'string' && query.community
            ? { community: query.community }
            : {},
          typeof query.event === 'string' && query.event ? { event: query.event } : {},
          Object.keys(buildDateRange(query.from, query.to, { endOfDay: true })).length > 0
            ? { date: buildDateRange(query.from, query.to, { endOfDay: true }) }
            : {},
        ) as Record<string, unknown>,
    });
  }

  /** Uploads a document and stores its metadata (single file per document). */
  async uploadDocument(
    user: AuthUser,
    file: StoredFile | undefined,
    metadata: DocumentMetadata,
  ): Promise<DocumentFileDocument> {
    if (!file) throw ApiError.badRequest('No file uploaded');
    if (!metadata.title) throw ApiError.badRequest('A document title is required');

    const category =
      (readEnum(metadata.category, Object.values(DOCUMENT_CATEGORY)) as
        | (typeof DOCUMENT_CATEGORY)[keyof typeof DOCUMENT_CATEGORY]
        | undefined) ?? DOCUMENT_CATEGORY.OFFICIAL_DOCUMENTS;
    const visibility =
      (readEnum(metadata.visibility, Object.values(VISIBILITY)) as
        | (typeof VISIBILITY)[keyof typeof VISIBILITY]
        | undefined) ?? VISIBILITY.MEMBERS_ONLY;

    const payload = {
      title: metadata.title,
      description: metadata.description,
      category,
      visibility,
      unit: metadata.unit,
      community: metadata.community,
      committee: metadata.committee,
      event: metadata.event,
      tags: metadata.tags ?? [],
      date: metadata.date ? new Date(metadata.date) : new Date(),
      uploadedBy: user.id,
      district: user.district ?? undefined,
      file: {
        url: file.url,
        key: file.key,
        name: file.originalName,
        type: file.mimeType,
        size: file.size,
        storageProvider: file.storageProvider,
      },
    };

    return documentRepository.create(payload);
  }

  async removeDocument(user: AuthUser, id: string): Promise<void> {
    const document = await documentRepository.findByIdScoped(id, user, 'Document');
    await getStorageProvider()
      .remove(document.file.key)
      .catch(() => undefined);
    await documentRepository.deleteById(id);
  }

  /** Public documents (visibility PUBLIC only). */
  async listPublic(query: Record<string, unknown>) {
    const filter: Record<string, unknown> = { visibility: VISIBILITY.PUBLIC };
    const category = readEnum(query.category, Object.values(DOCUMENT_CATEGORY));
    if (category) filter.category = category;
    return documentRepository.list(null, query, filter);
  }

  /** Documents a signed in member may access, honouring visibility rules. */
  async listForMember(user: AuthUser, query: Record<string, unknown>) {
    if (!user.member) throw ApiError.forbidden('No member profile linked to this account');
    const member = await memberRepository.findByIdScoped(user.member, user, 'Member');
    const conditions: Record<string, unknown>[] = [
      { visibility: { $in: [VISIBILITY.PUBLIC, VISIBILITY.MEMBERS_ONLY] } },
    ];
    if (member.district) {
      conditions.push({ visibility: VISIBILITY.DISTRICT_ONLY, district: member.district });
    }
    if (member.unit) conditions.push({ visibility: VISIBILITY.UNIT_ONLY, unit: member.unit });
    if (member.communities?.length) {
      conditions.push({
        visibility: VISIBILITY.COMMUNITY_ONLY,
        community: { $in: member.communities },
      });
    }

    return documentRepository.list(user, query, { $or: conditions } as Record<string, unknown>);
  }

  async registerDownload(id: string): Promise<void> {
    await documentRepository.incrementDownloads(id);
  }

  async categoryStats(user: AuthUser) {
    const match = documentRepository.buildFilter(user, {});
    return documentRepository.categoryBreakdown(match as Record<string, unknown>);
  }
}

export const documentService = new DocumentService();
