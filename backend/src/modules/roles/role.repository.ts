import { BaseRepository } from '../../shared/BaseRepository';
import { RoleModel } from './role.model';
import type { RoleDocument } from './role.model';

export class RoleRepository extends BaseRepository<RoleDocument> {
  constructor() {
    super(RoleModel, {
      searchFields: ['name', 'label', 'description'],
      allowedSortFields: ['rank', 'name', 'createdAt', 'updatedAt'],
      defaultSort: 'rank',
    });
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.findOne({ name });
  }

  async findByNames(names: string[]): Promise<RoleDocument[]> {
    return RoleModel.find({ name: { $in: names } }).lean<RoleDocument[]>().exec();
  }

  async updatePermissions(name: string, permissions: string[]): Promise<RoleDocument | null> {
    return RoleModel.findOneAndUpdate(
      { name },
      { $set: { permissions } },
      { new: true, runValidators: true },
    )
      .lean<RoleDocument>()
      .exec();
  }
}

export const roleRepository = new RoleRepository();
