import mongoose from 'mongoose';
import { DOCUMENT_CATEGORY, VISIBILITY } from '../../constants/enums';
import type { DocumentCategory, Visibility } from '../../constants/enums';

export interface DocumentFileDocument extends mongoose.Document {
  title: string;
  description?: string;
  file: {
    url: string;
    key: string;
    name: string;
    type: string;
    size: number;
    storageProvider: string;
  };
  category: DocumentCategory;
  uploadedBy?: mongoose.Types.ObjectId;
  district?: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  committee?: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  visibility: Visibility;
  date: Date;
  tags: string[];
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new mongoose.Schema<DocumentFileDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 220, index: true },
    description: { type: String, maxlength: 1000 },
    file: {
      url: { type: String, required: true },
      key: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true, min: 0 },
      storageProvider: { type: String, default: 'local' },
    },
    category: {
      type: String,
      enum: Object.values(DOCUMENT_CATEGORY),
      default: DOCUMENT_CATEGORY.OFFICIAL_DOCUMENTS,
      index: true,
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    committee: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.MEMBERS_ONLY,
      index: true,
    },
    date: { type: Date, default: Date.now, index: true },
    tags: { type: [String], default: [] },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'documents' },
);

documentSchema.index({ category: 1, date: -1 });
documentSchema.index({ district: 1, visibility: 1, date: -1 });
documentSchema.index({ district: 1, unit: 1, date: -1 });
documentSchema.index({ title: 'text', description: 'text' });

export const DocumentFileModel = mongoose.model<DocumentFileDocument>(
  'Document',
  documentSchema,
);
