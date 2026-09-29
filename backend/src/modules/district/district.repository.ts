import { BaseRepository } from '../../shared/BaseRepository';
import { DistrictModel } from './district.model';
import type { DistrictDocument } from './district.model';

export class DistrictRepository extends BaseRepository<DistrictDocument> {
  constructor() {
    super(DistrictModel, {
      searchFields: ['name', 'code', 'province', 'description'],
      allowedSortFields: ['name', 'code', 'createdAt', 'status'],
      defaultSort: 'name',
      populate: [{ path: 'organization', select: 'name shortName logo' }],
    });
  }

  async findByCode(code: string): Promise<DistrictDocument | null> {
    return this.findOne({ code: code.toUpperCase() });
  }

  async findByName(name: string): Promise<DistrictDocument | null> {
    return DistrictModel.findOne({ name: new RegExp(`^${name}$`, 'i') })
      .lean<DistrictDocument>()
      .exec();
  }
}

export const districtRepository = new DistrictRepository();

