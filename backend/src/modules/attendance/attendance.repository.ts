import type { PipelineStage } from 'mongoose';
import { BaseRepository } from '../../shared/BaseRepository';
import { AttendanceModel } from './attendance.model';
import type { AttendanceDocument } from './attendance.model';

const POPULATE = [
  { path: 'member', select: 'memberId firstName middleName lastName photo unit communities' },
  { path: 'event', select: 'title startDate type level unit community' },
  { path: 'unit', select: 'name code' },
  { path: 'community', select: 'name code' },
];

export class AttendanceRepository extends BaseRepository<AttendanceDocument> {
  constructor() {
    super(AttendanceModel, {
      searchFields: ['remarks'],
      allowedSortFields: ['date', 'createdAt', 'status'],
      defaultSort: 'date',
      populate: POPULATE,
    });
  }

  async findForEventAndMember(eventId: string, memberId: string) {
    return this.findOne({ event: eventId, member: memberId });
  }

  /** Idempotent upsert used by individual and bulk attendance marking. */
  async upsertForEventAndMember(
    eventId: string,
    memberId: string,
    data: Record<string, unknown>,
  ) {
    return AttendanceModel.findOneAndUpdate(
      { event: eventId, member: memberId },
      { $set: data, $setOnInsert: { event: eventId, member: memberId } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    )
      .populate(POPULATE)
      .lean<AttendanceDocument>()
      .exec();
  }

  async deleteForEvent(eventId: string): Promise<void> {
    await AttendanceModel.deleteMany({ event: eventId }).exec();
  }

  async countByStatus(match: Record<string, unknown>) {
    const rows = await this.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return rows.map((row) => ({ key: String(row._id), count: row.count }));
  }

  /** Attendance percentage trend per month. */
  async monthlyTrend(
    match: Record<string, unknown>,
    since: Date,
  ): Promise<Array<{ month: string; present: number; total: number }>> {
    const pipeline: PipelineStage[] = [
      { $match: { ...match, date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const rows = await this.aggregate<{ _id: string; total: number; present: number }>(pipeline);
    return rows.map((row) => ({ month: row._id, total: row.total, present: row.present }));
  }

  /** Per event attendance totals used by the participation chart. */
  async eventTotals(
    match: Record<string, unknown>,
    limit = 8,
  ): Promise<Array<{ eventId: string; title: string; present: number; total: number }>> {
    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: '$event',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          eventId: { $toString: '$_id' },
          title: { $ifNull: ['$event.title', 'Unknown event'] },
          total: 1,
          present: 1,
        },
      },
    ];
    return this.aggregate<{ eventId: string; title: string; present: number; total: number }>(
      pipeline,
    );
  }
}

export const attendanceRepository = new AttendanceRepository();
