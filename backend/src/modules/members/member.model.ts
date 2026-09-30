import mongoose from 'mongoose';
import {
  COMMITTEE_POSITION,
  GENDER,
  MEMBERSHIP_TYPE,
  MEMBER_STATUS,
  REGISTRATION_STATUS,
} from '../../constants/enums';
import type {
  CommitteePosition,
  Gender,
  MembershipType,
  MemberStatus,
  RegistrationStatus,
} from '../../constants/enums';

export interface MemberCommitteePosition {
  committee: mongoose.Types.ObjectId;
  position: CommitteePosition;
  role?: string;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
}

export interface MemberDocument extends mongoose.Document {
  memberId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  photo?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  phone?: string;
  email?: string;
  address?: string;
  municipality?: string;
  ward?: string;
  emergencyContact?: string;
  joinedDate?: Date;
  occupation?: string;
  education?: string;
  notes?: string;
  organization?: mongoose.Types.ObjectId;
  district: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  communities: mongoose.Types.ObjectId[];
  committeePositions: MemberCommitteePosition[];
  membershipType: MembershipType;
  status: MemberStatus;
  registrationStatus?: RegistrationStatus;
  registrationRequestedBy?: mongoose.Types.ObjectId;
  registrationRequestedAt?: Date;
  registrationReviewedBy?: mongoose.Types.ObjectId;
  registrationReviewedAt?: Date;
  registrationReviewNote?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const committeePositionSchema = new mongoose.Schema<MemberCommitteePosition>(
  {
    committee: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', required: true },
    position: { type: String, enum: Object.values(COMMITTEE_POSITION), required: true },
    role: { type: String, trim: true, maxlength: 80 },
    startDate: { type: Date },
    endDate: { type: Date },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const memberSchema = new mongoose.Schema<MemberDocument>(
  {
    memberId: { type: String, required: true, unique: true, index: true, trim: true },
    firstName: { type: String, required: true, trim: true, maxlength: 60, index: true },
    middleName: { type: String, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60, index: true },
    photo: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: Object.values(GENDER), index: true },
    phone: { type: String, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    address: { type: String, trim: true, maxlength: 300 },
    municipality: { type: String, trim: true, maxlength: 120 },
    ward: { type: String, trim: true, maxlength: 20 },
    emergencyContact: { type: String, trim: true, maxlength: 30 },
    joinedDate: { type: Date, default: Date.now },
    occupation: { type: String, trim: true, maxlength: 120 },
    education: { type: String, trim: true, maxlength: 120 },
    notes: { type: String, maxlength: 1000 },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true,
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    communities: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
      default: [],
      index: true,
    },
    committeePositions: { type: [committeePositionSchema], default: [] },
    membershipType: {
      type: String,
      enum: Object.values(MEMBERSHIP_TYPE),
      default: MEMBERSHIP_TYPE.REGULAR,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(MEMBER_STATUS),
      default: MEMBER_STATUS.PENDING,
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      index: true,
    },
    registrationRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registrationRequestedAt: { type: Date },
    registrationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registrationReviewedAt: { type: Date },
    registrationReviewNote: { type: String, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'members',
    toJSON: { virtuals: true },
  },
);

memberSchema.index({ district: 1, unit: 1, status: 1 });
memberSchema.index({ district: 1, communities: 1, status: 1 });
memberSchema.index({ district: 1, status: 1, createdAt: -1 });
memberSchema.index({ firstName: 1, lastName: 1 });
memberSchema.index({ memberId: 1, status: 1 });
memberSchema.index(
  { registrationStatus: 1, createdAt: -1 },
  { partialFilterExpression: { registrationStatus: { $exists: true } } },
);

memberSchema.virtual('fullName').get(function fullName(this: MemberDocument) {
  return [this.firstName, this.middleName, this.lastName].filter(Boolean).join(' ');
});

export const MemberModel = mongoose.model<MemberDocument>('Member', memberSchema);
