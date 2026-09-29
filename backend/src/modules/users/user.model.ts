import mongoose from 'mongoose';
import { ACCOUNT_STATUS } from '../../constants/enums';
import type { AccountStatus } from '../../constants/enums';
import { ALL_ROLE_NAMES } from '../../constants/roles';
import type { RoleName } from '../../constants/roles';
import { ALL_PERMISSIONS } from '../../constants/permissions';
import type { Permission } from '../../constants/permissions';

export interface RefreshTokenRecord {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface UserDocument extends mongoose.Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  passwordHash: string;
  role: RoleName;
  /** Role defaults are inherited; these are additional (or overriding) grants. */
  permissions: Permission[];
  member?: mongoose.Types.ObjectId;
  district?: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  committee?: mongoose.Types.ObjectId;
  status: AccountStatus;
  forcePasswordChange: boolean;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  refreshTokens: RefreshTokenRecord[];
  passwordReset?: { tokenHash: string; expiresAt: Date };
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  note?: string;
  isSystemAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new mongoose.Schema<RefreshTokenRecord>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema<UserDocument>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    middleName: { type: String, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, index: true },
    profilePhoto: { type: String },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ALL_ROLE_NAMES,
      required: true,
      index: true,
    },
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: [],
    },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', index: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    committee: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', index: true },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index: true,
    },
    forcePasswordChange: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    passwordReset: {
      tokenHash: { type: String },
      expiresAt: { type: Date },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, maxlength: 500 },
    isSystemAccount: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.passwordReset;
        delete ret.loginAttempts;
        delete ret.lockedUntil;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ district: 1, unit: 1, role: 1 });
userSchema.index({ district: 1, community: 1, role: 1 });
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ createdAt: -1 });

userSchema.virtual('fullName').get(function fullName(this: UserDocument) {
  return [this.firstName, this.middleName, this.lastName].filter(Boolean).join(' ');
});

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
