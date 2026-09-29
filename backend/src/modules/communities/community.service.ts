import { ApiError } from '../../utils/ApiError';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { communityRepository } from './community.repository';
import type { CommunityDocument } from './community.model';

export class CommunityService extends ScopedCrudService<CommunityDocument> {
  constructor() {
    super({
      entityLabel: 'Community',
      auditEntity: 'Community',
      repository: communityRepository,
      buildListFilter: (query) => ({
        ...(typeof query.status === 'string' && query.status ? { status: query.status } : {}),
        ...(typeof query.targetGroup === 'string' && query.targetGroup
          ? { targetGroup: query.targetGroup }
          : {}),
      }),
      prepareCreate: async (user, payload) => {
        const districtId = String(payload.district ?? user.district ?? '');
        if (!districtId) throw ApiError.badRequest('A district is required to create a community');
        const existing = await communityRepository.findByCode(districtId, String(payload.code));
        if (existing) {
          throw ApiError.conflict('A community with this code already exists in the district');
        }
        return { ...payload, district: districtId };
      },
      prepareUpdate: async (_user, existing, payload) => {
        if (typeof payload.code === 'string' && payload.code.toUpperCase() !== existing.code) {
          const duplicate = await communityRepository.findByCode(
            String(existing.district),
            payload.code,
          );
          if (duplicate && String(duplicate._id) !== String(existing._id)) {
            throw ApiError.conflict('A community with this code already exists in the district');
          }
        }
        return payload;
      },
      beforeRemove: async (_user, existing) => {
        const { memberRepository } = await import('../members/member.repository');
        const memberCount = await memberRepository.count(null, { communities: existing._id });
        if (memberCount > 0) {
          throw ApiError.conflict(
            'This community still has members assigned. Remove the members from the community before deleting it.',
          );
        }
      },
    });
  }

  async getOptions(filter: Record<string, unknown>) {
    return communityRepository.optionsForScope(filter);
  }
}

export const communityService = new CommunityService();
