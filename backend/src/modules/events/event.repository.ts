import type { PipelineStage } from 'mongoose';
import { BaseRepository } from '../../shared/BaseRepository';
import { EventModel } from './event.model';
import type { EventDocument } from './event.model';

const POPULATE = [
  { path: 'district', select: 'name code' },
  { path: 'unit', select: 'name code location' },
  { path: 'community', select: 'name code targetGroup' },
  { path: 'committee', select: 'name level' },
];

export class EventRepository extends BaseRepository<EventDocument> {
  constructor() {
    super(EventModel, {
      searchFields: ['title', 'description', 'organizer', 'location'],
      allowedSortFields: ['startDate', 'endDate', 'createdAt', 'title', 'status', 'type'],
      defaultSort: 'startDate',
      populate: POPULATE,
    });
  }

  /** Upcoming events feed (public + dashboard). */
  async upcoming(
    match: Record<string, unknown>,
    limit = 6,
  ): Promise<EventDocument[]> {
    const rows = await EventModel.find({
      ...match,
      startDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: { $in: ['SCHEDULED', 'ONGOING'] },
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .populate(POPULATE)
      .lean<EventDocument[]>()
      .exec();
    return rows;
  }

  async countByStatus(match: Record<string, unknown>) {
    const rows = await this.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return rows.map((row) => ({ key: String(row._id), count: row.count }));
  }

  async monthlyCounts(
    match: Record<string, unknown>,
    since: Date,
  ): Promise<Array<{ month: string; count: number }>> {
    const pipeline: PipelineStage[] = [
      { $match: { ...match, startDate: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$startDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const rows = await this.aggregate<{ _id: string; count: number }>(pipeline);
    return rows.map((row) => ({ month: row._id, count: row.count }));
  }
}

export const eventRepository = new EventRepository();
