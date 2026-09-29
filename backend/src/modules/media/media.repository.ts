import { BaseRepository } from '../../shared/BaseRepository';
import { MediaModel } from './media.model';
import type { MediaDocument } from './media.model';

export class MediaRepository extends BaseRepository<MediaDocument> {
  constructor() {
    super(MediaModel, {
      searchFields: ['originalName', 'title', 'caption', 'tags'],
      allowedSortFields: ['createdAt', 'fileSize', 'originalName', 'category'],
      defaultSort: 'createdAt',
      populate: [
        { path: 'uploadedBy', select: 'firstName lastName email' },
        { path: 'district', select: 'name code' },
        { path: 'unit', select: 'name code' },
        { path: 'community', select: 'name code' },
      ],
    });
  }

  async storageBreakdown(match: Record<string, unknown>) {
    const rows = await this.aggregate<{ _id: string; count: number; size: number }>([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 }, size: { $sum: '$fileSize' } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map((row) => ({
      key: String(row._id),
      label: String(row._id),
      count: row.count,
      size: row.size,
    }));
  }

  async attachUsage(
    mediaIds: string[],
    entity: string,
    entityId: string,
  ): Promise<void> {
    await MediaModel.updateMany(
      { _id: { $in: mediaIds } },
      { $push: { usage: { entity, entityId } } },
    ).exec();
  }
}

export const mediaRepository = new MediaRepository();
