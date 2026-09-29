import { BaseRepository } from '../../shared/BaseRepository';
import { DocumentFileModel } from './document.model';
import type { DocumentFileDocument } from './document.model';

export class DocumentRepository extends BaseRepository<DocumentFileDocument> {
  constructor() {
    super(DocumentFileModel, {
      searchFields: ['title', 'description', 'tags', 'file.name'],
      allowedSortFields: ['date', 'createdAt', 'title', 'downloadCount', 'category'],
      defaultSort: 'date',
      populate: [
        { path: 'uploadedBy', select: 'firstName lastName email' },
        { path: 'district', select: 'name code' },
        { path: 'unit', select: 'name code' },
        { path: 'community', select: 'name code' },
        { path: 'event', select: 'title startDate' },
      ],
    });
  }

  async incrementDownloads(id: string): Promise<void> {
    await DocumentFileModel.updateOne({ _id: id }, { $inc: { downloadCount: 1 } }).exec();
  }

  async categoryBreakdown(match: Record<string, unknown>) {
    const rows = await this.aggregate<{ _id: string; count: number; size: number }>([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 }, size: { $sum: '$file.size' } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map((row) => ({
      key: String(row._id),
      label: String(row._id),
      count: row.count,
      size: row.size,
    }));
  }
}

export const documentRepository = new DocumentRepository();
