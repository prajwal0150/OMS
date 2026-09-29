import mongoose from 'mongoose';
import { BaseRepository } from '../../shared/BaseRepository';
import { MemberModel } from './member.model';
import type { MemberDocument } from './member.model';

const POPULATE = [
  { path: 'district', select: 'name code province' },
  { path: 'unit', select: 'name code location' },
  { path: 'communities', select: 'name code targetGroup' },
  { path: 'committeePositions.committee', select: 'name level' },
];

export class MemberRepository extends BaseRepository<MemberDocument> {
  constructor() {
    super(MemberModel, {
      searchFields: ['firstName', 'middleName', 'lastName', 'memberId', 'email', 'phone'],
      allowedSortFields: ['createdAt', 'updatedAt', 'firstName', 'lastName', 'memberId', 'joinedDate', 'status'],
      defaultSort: 'createdAt',
      populate: POPULATE,
    });
  }

  async findByMemberId(memberId: string): Promise<MemberDocument | null> {
    return this.findOne({ memberId });
  }

  async findWithAccount(id: string): Promise<MemberDocument | null> {
    return this.findById(id);
  }

  async addCommitteePosition(
    memberId: string,
    position: Record<string, unknown>,
  ): Promise<void> {
    await MemberModel.updateOne(
      { _id: memberId },
      { $push: { committeePositions: position } },
    ).exec();
  }

  async updateCommitteePosition(
    memberId: string,
    committeeId: string,
    position: string,
    update: Record<string, unknown>,
  ): Promise<void> {
    await MemberModel.updateOne(
      { _id: memberId, 'committeePositions.committee': committeeId, 'committeePositions.position': position },
      {
        $set: {
          'committeePositions.$.role': update.role,
          'committeePositions.$.startDate': update.startDate,
          'committeePositions.$.endDate': update.endDate,
          'committeePositions.$.active': update.active,
        },
      },
    ).exec();
  }

  async removeCommitteePosition(
    memberId: string,
    committeeId: string,
    position: string,
  ): Promise<void> {
    await MemberModel.updateOne(
      { _id: memberId },
      { $pull: { committeePositions: { committee: committeeId, position } } },
    ).exec();
  }

  /** Grouped statistics used by dashboards and reports. */
  async plainGroupedCounts(
    match: Record<string, unknown>,
    field: string,
  ): Promise<Array<{ key: string; count: number }>> {
    const rows = await this.aggregate<{ _id: unknown; count: number }>([
      { $match: match },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map((row) => ({
      key: row._id === null || row._id === undefined ? 'UNKNOWN' : String(row._id),
      count: row.count,
    }));
  }

  async communityGroupedCounts(
    match: Record<string, unknown>,
  ): Promise<Array<{ key: string; count: number }>> {
    const rows = await this.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: match },
      { $unwind: '$communities' },
      { $group: { _id: '$communities', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map((row) => ({ key: String(row._id), count: row.count }));
  }

  async createdAtValues(match: Record<string, unknown>, since: Date): Promise<Date[]> {
    const rows = await this.aggregate<{ createdAt: Date }>([
      { $match: { ...match, createdAt: { $gte: since } } },
      { $project: { createdAt: 1, _id: 0 } },
    ]);
    return rows.map((row) => row.createdAt);
  }
}

export const memberRepository = new MemberRepository();
