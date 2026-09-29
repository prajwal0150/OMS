import type { PipelineStage } from 'mongoose';
import { BaseRepository } from '../../shared/BaseRepository';
import { ContentModel } from './content.model';
import type { ContentDocument } from './content.model';

const POPULATE = [
  { path: 'district', select: 'name code province' },
  { path: 'unit', select: 'name code location' },
  { path: 'community', select: 'name code targetGroup' },
  { path: 'committee', select: 'name level' },
  { path: 'event', select: 'title startDate type' },
  { path: 'author', select: 'firstName lastName email' },
  { path: 'publishedBy', select: 'firstName lastName' },
];

export class ContentRepository extends BaseRepository<ContentDocument> {
  constructor() {
    super(ContentModel, {
      searchFields: ['title', 'summary', 'slug', 'tags'],
      allowedSortFields: ['publishedAt', 'createdAt', 'updatedAt', 'title', 'views', 'status'],
      defaultSort: 'publishedAt',
      populate: POPULATE,
    });
  }

  async findBySlug(slug: string): Promise<ContentDocument | null> {
    return this.findOne({ slug });
  }

  async slugExists(slug: string): Promise<boolean> {
    return this.exists({ slug });
  }

  async incrementViews(slug: string): Promise<void> {
    await ContentModel.updateOne({ slug }, { $inc: { views: 1 } }).exec();
  }

  async countByStatus(match: Record<string, unknown>) {
    const rows = await this.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return rows.map((row) => ({ key: String(row._id), count: row.count }));
  }

  async countByType(match: Record<string, unknown>) {
    const rows = await this.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map((row) => ({ key: String(row._id), label: String(row._id), count: row.count }));
  }

  async monthlyCounts(
    match: Record<string, unknown>,
    since: Date,
  ): Promise<Array<{ month: string; count: number }>> {
    const pipeline: PipelineStage[] = [
      { $match: { ...match, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const rows = await this.aggregate<{ _id: string; count: number }>(pipeline);
    return rows.map((row) => ({ month: row._id, count: row.count }));
  }

  /** Gallery items across published content (public gallery page). */
  async galleryItems(
    match: Record<string, unknown>,
    limit = 60,
  ): Promise<Array<{ url: string; caption?: string; alt?: string; title: string; slug: string; createdAt: Date }>> {
    const rows = await this.aggregate<{
      url: string;
      caption?: string;
      alt?: string;
      title: string;
      slug: string;
      createdAt: Date;
    }>([
      { $match: { ...match, 'gallery.0': { $exists: true } } },
      { $sort: { publishedAt: -1, createdAt: -1 } },
      { $limit: limit },
      { $unwind: '$gallery' },
      {
        $project: {
          _id: 0,
          url: '$gallery.url',
          caption: '$gallery.caption',
          alt: '$gallery.alt',
          title: '$title',
          slug: '$slug',
          createdAt: '$createdAt',
        },
      },
    ]);
    return rows;
  }
}

export const contentRepository = new ContentRepository();
