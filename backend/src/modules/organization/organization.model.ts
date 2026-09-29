import mongoose from 'mongoose';
import { ORGANIZATION_NAME } from '../../constants/enums';

export interface OrganizationDocument extends mongoose.Document {
  name: string;
  shortName?: string;
  slug: string;
  logo?: string;
  description?: string;
  establishedDate?: Date;
  district?: mongoose.Types.ObjectId;
  province: string;
  country: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  };
  active: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new mongoose.Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, trim: true, default: ORGANIZATION_NAME },
    shortName: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    description: { type: String, maxlength: 2000 },
    establishedDate: { type: Date },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true },
    province: { type: String, trim: true, default: 'Koshi Province' },
    country: { type: String, trim: true, default: 'Nepal' },
    address: { type: String, trim: true, maxlength: 300 },
    phone: { type: String, trim: true, maxlength: 30 },
    email: { type: String, lowercase: true, trim: true },
    website: { type: String, trim: true },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      youtube: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
    },
    active: { type: Boolean, default: true, index: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'organizations' },
);

export const OrganizationModel = mongoose.model<OrganizationDocument>(
  'Organization',
  organizationSchema,
);
