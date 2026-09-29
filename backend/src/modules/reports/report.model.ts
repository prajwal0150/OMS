import mongoose from 'mongoose';
import { EXPORT_FORMAT, REPORT_TYPE } from '../../constants/enums';
import type { ExportFormat, ReportType } from '../../constants/enums';

export interface ReportRecordDocument extends mongoose.Document {
  type: ReportType;
  format: ExportFormat;
  title: string;
  filters: Record<string, unknown>;
  rowCount: number;
  district?: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  generatedBy?: mongoose.Types.ObjectId;
  generatedByName?: string;
  createdAt: Date;
}

const reportRecordSchema = new mongoose.Schema<ReportRecordDocument>(
  {
    type: { type: String, enum: Object.values(REPORT_TYPE), required: true, index: true },
    format: { type: String, enum: Object.values(EXPORT_FORMAT), required: true },
    title: { type: String, required: true, maxlength: 200 },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    rowCount: { type: Number, default: 0 },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    generatedByName: { type: String, maxlength: 160 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'report_records' },
);

reportRecordSchema.index({ createdAt: -1 });
reportRecordSchema.index({ district: 1, createdAt: -1 });

export const ReportRecordModel = mongoose.model<ReportRecordDocument>(
  'ReportRecord',
  reportRecordSchema,
);
