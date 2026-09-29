import mongoose from 'mongoose';
import {
  CONTENT_STATUS,
  CONTENT_TYPE,
  VIDEO_TYPE,
  VISIBILITY,
} from '../../constants/enums';
import type {
  ContentStatus,
  ContentType,
  VideoType,
  Visibility,
} from '../../constants/enums';

export interface GalleryImage {
  url: string;
  caption?: string;
  alt?: string;
  order: number;
  isCover: boolean;
}

export interface ContentVideo {
  videoType: VideoType;
  videoUrl: string;
  thumbnail?: string;
  caption?: string;
}

export interface ContentDocument extends mongoose.Document {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  contentType: ContentType;
  coverImage?: string;
  gallery: GalleryImage[];
  videos: ContentVideo[];
  documents: mongoose.Types.ObjectId[];
  author?: mongoose.Types.ObjectId;
  publishedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
  district: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  committee?: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  visibility: Visibility;
  status: ContentStatus;
  reviewNotes?: string;
  rejectionReason?: string;
  publishedAt?: Date;
  scheduledAt?: Date;
  views: number;
  tags: string[];
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gallerySchema = new mongoose.Schema<GalleryImage>(
  {
    url: { type: String, required: true },
    caption: { type: String, maxlength: 300 },
    alt: { type: String, maxlength: 300 },
    order: { type: Number, default: 0 },
    isCover: { type: Boolean, default: false },
  },
  { _id: true },
);

const videoSchema = new mongoose.Schema<ContentVideo>(
  {
    videoType: { type: String, enum: Object.values(VIDEO_TYPE), default: VIDEO_TYPE.UPLOAD },
    videoUrl: { type: String, required: true },
    thumbnail: { type: String },
    caption: { type: String, maxlength: 300 },
  },
  { _id: true },
);

const contentSchema = new mongoose.Schema<ContentDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 250, index: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    summary: { type: String, maxlength: 600 },
    content: { type: String, default: '' },
    contentType: {
      type: String,
      enum: Object.values(CONTENT_TYPE),
      default: CONTENT_TYPE.NEWS,
      index: true,
    },
    coverImage: { type: String },
    gallery: { type: [gallerySchema], default: [] },
    videos: { type: [videoSchema], default: [] },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true,
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    committee: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.PUBLIC,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CONTENT_STATUS),
      default: CONTENT_STATUS.DRAFT,
      index: true,
    },
    reviewNotes: { type: String, maxlength: 600 },
    rejectionReason: { type: String, maxlength: 600 },
    publishedAt: { type: Date, index: true },
    scheduledAt: { type: Date, index: true },
    views: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'contents' },
);

contentSchema.index({ status: 1, publishedAt: -1 });
contentSchema.index({ status: 1, scheduledAt: 1 });
contentSchema.index({ district: 1, unit: 1, status: 1, publishedAt: -1 });
contentSchema.index({ district: 1, community: 1, status: 1 });
contentSchema.index({ contentType: 1, status: 1, createdAt: -1 });
contentSchema.index({ title: 'text', summary: 'text', content: 'text' });

export const ContentModel = mongoose.model<ContentDocument>('Content', contentSchema);
