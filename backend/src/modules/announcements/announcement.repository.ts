import { BaseRepository } from '../../shared/BaseRepository';
import { AnnouncementModel } from './announcement.model';
import type { AnnouncementDocument } from './announcement.model';

const POPULATE = [
  { path: 'district', select: 'name code' },
  { path: 'unit', select: 'name code location' },
  { path: 'community', select: 'name code targetGroup' },
  { path: 'committee', select: 'name level' },
  { path: 'selectedMembers', select: 'memberId firstName lastName' },
  { path: 'createdBy', select: 'firstName lastName' },
];

export class AnnouncementRepository extends BaseRepository<AnnouncementDocument> {
  constructor() {
    super(AnnouncementModel, {
      searchFields: ['title', 'content'],
      allowedSortFields: ['publishDate', 'expiryDate', 'createdAt', 'title', 'status'],
      defaultSort: 'publishDate',
      populate: POPULATE,
    });
  }

  /** Active (not expired) announcements matching the supplied filter. */
  filterActive(): Record<string, unknown> {
    return {
      publishDate: { $lte: new Date() },
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: new Date() } }],
    };
  }

  async countByMonth(
    match: Record<string, unknown>,
    since: Date,
  ): Promise<Array<{ month: string; count: number }>> {
    const rows = await this.aggregate<{ _id: string; count: number }>([
      { $match: { ...match, publishDate: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$publishDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((row) => ({ month: row._id, count: row.count }));
  }
}

export const announcementRepository = new AnnouncementRepository();
