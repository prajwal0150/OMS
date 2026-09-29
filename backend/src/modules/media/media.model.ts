import mongoose from 'mongoose';
import { MEDIA_CATEGORY } from '../../constants/enums';
import type { MediaCategory } from '../../constants/enums';

export interface MediaDocument extends mongoose.Document {
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  storageKey: string;
  storageProvider: string;
  thumbnailUrl?: string;
  category: MediaCategory;
  title?: string;
  alt?: string;
  caption?: string;
  tags: string[];
  uploadedBy?: mongoose.Types.ObjectId;
  district?: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  /** Polymorphic usage links (content, event, announcement). */
  usage: Array<{ entity: string; entityId: mongoose.Types.ObjectId }>;
  createdAt: Date;
  updatedAt: Date;
}

const usageSchema = new mongoose.Schema(
  { entity: { type: String, required: true }, entityId: { type: mongoose.Schema.Types.ObjectId } },
  { _id: false },
);

const mediaSchema = new mongoose.Schema<MediaDocument>(
  {
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    fileType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true, min: 0 },
    storageUrl: { type: String, required: true },
    storageKey: { type: String, required: true, index: true },
    storageProvider: { type: String, default: 'local' },
    thumbnailUrl: { type: String },
    category: {
      type: String,
      enum: Object.values(MEDIA_CATEGORY),
      default: MEDIA_CATEGORY.IMAGE,
      index: true,
    },
    title: { type: String, trim: true, maxlength: 200 },
    alt: { type: String, trim: true, maxlength: 300 },
    caption: { type: String, trim: true, maxlength: 400 },
    tags: { type: [String], default: [] },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    usage: { type: [usageSchema], default: [] },
  },
  { timestamps: true, collection: 'media' },
);

mediaSchema.index({ category: 1, createdAt: -1 });
mediaSchema.index({ district: 1, category: 1, createdAt: -1 });
mediaSchema.index({ originalName: 'text', title: 'text', caption: 'text' });

export const MediaModel = mongoose.model<MediaDocument>('Media', mediaSchema);
