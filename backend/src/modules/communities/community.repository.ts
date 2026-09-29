import { BaseRepository } from '../../shared/BaseRepository';
import { CommunityModel } from './community.model';
import type { CommunityDocument } from './community.model';

export class CommunityRepository extends BaseRepository<CommunityDocument> {
  constructor() {
    super(CommunityModel, {
      searchFields: ['name', 'code', 'description', 'ageGroup'],
      allowedSortFields: ['name', 'code', 'createdAt', 'status', 'targetGroup'],
      defaultSort: 'name',
      populate: [
        { path: 'district', select: 'name code province' },
        { path: 'unit', select: 'name code location' },
        { path: 'coordinator', select: 'memberId firstName lastName' },
      ],
    });
  }

  async findByCode(districtId: string, code: string): Promise<CommunityDocument | null> {
    return this.findOne({ district: districtId, code: code.toUpperCase() });
  }

  async optionsForScope(
    filter: Record<string, unknown>,
  ): Promise<Array<{ _id: string; name: string; code: string; targetGroup: string }>> {
    const communities = await this.list(null, { limit: 200, sort: 'name', order: 'asc' }, filter);
    return communities.items.map((community) => ({
      _id: String(community._id),
      name: community.name,
      code: community.code,
      targetGroup: community.targetGroup,
    }));
  }
}

export const communityRepository = new CommunityRepository();
