import mongoose from 'mongoose';
import { BaseRepository } from '../../shared/BaseRepository';
import { CommitteeModel } from './committee.model';
import type { CommitteeDocument } from './committee.model';

const POPULATE = [
  { path: 'district', select: 'name code' },
  { path: 'unit', select: 'name code location' },
  { path: 'community', select: 'name code targetGroup' },
  { path: 'positions.member', select: 'memberId firstName middleName lastName photo status' },
];

export class CommitteeRepository extends BaseRepository<CommitteeDocument> {
  constructor() {
    super(CommitteeModel, {
      searchFields: ['name', 'description'],
      allowedSortFields: ['name', 'level', 'createdAt', 'status', 'startDate'],
      defaultSort: 'createdAt',
      populate: POPULATE,
    });
  }

  async addPosition(committeeId: string, entry: Record<string, unknown>) {
    return CommitteeModel.findByIdAndUpdate(
      committeeId,
      { $push: { positions: entry } },
      { new: true },
    )
      .populate(POPULATE)
      .lean<CommitteeDocument>()
      .exec();
  }

  async updatePosition(
    committeeId: string,
    positionId: string,
    update: Record<string, unknown>,
  ) {
    const set: Record<string, unknown> = {};
    for (const key of ['position', 'member', 'assignedDate', 'endDate', 'remarks', 'active']) {
      if (update[key] !== undefined) set[`positions.$.${key}`] = update[key];
    }
    return CommitteeModel.findOneAndUpdate(
      { _id: committeeId, 'positions._id': positionId },
      { $set: set },
      { new: true },
    )
      .populate(POPULATE)
      .lean<CommitteeDocument>()
      .exec();
  }

  async removePosition(committeeId: string, positionId: string) {
    return CommitteeModel.findByIdAndUpdate(
      committeeId,
      { $pull: { positions: { _id: positionId } } },
      { new: true },
    )
      .populate(POPULATE)
      .lean<CommitteeDocument>()
      .exec();
  }

  async findForMember(memberId: string) {
    const objectId = new mongoose.Types.ObjectId(memberId);
    return CommitteeModel.find({ 'positions.member': objectId })
      .populate(POPULATE)
      .lean<CommitteeDocument[]>()
      .exec();
  }

  async countByLevels(match: Record<string, unknown>) {
    const rows = await this.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map((row) => ({ key: String(row._id), label: String(row._id), count: row.count }));
  }
}

export const committeeRepository = new CommitteeRepository();
