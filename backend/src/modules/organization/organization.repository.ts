import { BaseRepository } from '../../shared/BaseRepository';
import { OrganizationModel } from './organization.model';
import type { OrganizationDocument } from './organization.model';

const POPULATE = [{ path: 'district', select: 'name code province country' }];

export class OrganizationRepository extends BaseRepository<OrganizationDocument> {
  constructor() {
    super(OrganizationModel, {
      searchFields: ['name', 'shortName', 'email'],
      allowedSortFields: ['createdAt', 'name'],
      populate: POPULATE,
    });
  }

  /** The organization profile is a singleton document. */
  async getSingleton(): Promise<OrganizationDocument | null> {
    return OrganizationModel.findOne({}).sort({ createdAt: 1 }).populate(POPULATE).lean<OrganizationDocument>().exec();
  }

  async updateSingleton(data: Record<string, unknown>): Promise<OrganizationDocument | null> {
    return OrganizationModel.findOneAndUpdate({}, { $set: data }, { new: true, runValidators: true })
      .populate(POPULATE)
      .lean<OrganizationDocument>()
      .exec();
  }
}

export const organizationRepository = new OrganizationRepository();
