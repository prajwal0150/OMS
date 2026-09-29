import { BaseRepository } from '../../shared/BaseRepository';
import { UnitModel } from './unit.model';
import type { UnitDocument } from './unit.model';

export class UnitRepository extends BaseRepository<UnitDocument> {
  constructor() {
    super(UnitModel, {
      searchFields: ['name', 'code', 'location', 'contactPerson', 'email', 'phone'],
      allowedSortFields: ['name', 'code', 'createdAt', 'status', 'establishedDate'],
      defaultSort: 'name',
      populate: [{ path: 'district', select: 'name code province' }],
    });
  }

  async findByCode(districtId: string, code: string): Promise<UnitDocument | null> {
    return this.findOne({ district: districtId, code: code.toUpperCase() });
  }

  async optionsForScope(
    filter: Record<string, unknown>,
  ): Promise<Array<{ _id: string; name: string; code: string }>> {
    const units = await this.list(null, { limit: 200, sort: 'name', order: 'asc' }, filter);
    return units.items.map((unit) => ({
      _id: String(unit._id),
      name: unit.name,
      code: unit.code,
    }));
  }
}

export const unitRepository = new UnitRepository();
