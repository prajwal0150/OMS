import { BaseRepository } from '../../shared/BaseRepository';
import { UserModel } from './user.model';
import type { RefreshTokenRecord, UserDocument } from './user.model';

const POPULATE = [
  { path: 'district', select: 'name code province country' },
  { path: 'unit', select: 'name code location' },
  { path: 'community', select: 'name code targetGroup' },
  { path: 'committee', select: 'name level' },
  { path: 'member', select: 'memberId firstName lastName status unit communities' },
];

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(UserModel, {
      searchFields: ['firstName', 'middleName', 'lastName', 'email', 'phone'],
      allowedSortFields: ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'lastLogin', 'status'],
      defaultSort: 'createdAt',
      populate: POPULATE,
    });
  }

  /** Loads a user including password hash and refresh tokens (auth flows only). */
  async findForAuthentication(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash +refreshTokens +loginAttempts +lockedUntil')
      .exec() as Promise<UserDocument | null>;
  }

  async findByIdWithSecrets(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id).select('+passwordHash +refreshTokens').exec() as Promise<UserDocument | null>;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  async setPassword(id: string, passwordHash: string): Promise<void> {
    await UserModel.updateOne(
      { _id: id },
      {
        $set: {
          passwordHash,
          passwordChangedAt: new Date(),
          forcePasswordChange: false,
          loginAttempts: 0,
          passwordReset: undefined,
        },
      },
    ).exec();
  }

  async setForcePasswordChange(id: string, value: boolean): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { forcePasswordChange: value } }).exec();
  }

  async storeRefreshToken(id: string, record: RefreshTokenRecord): Promise<void> {
    await UserModel.updateOne(
      { _id: id },
      {
        $push: {
          refreshTokens: {
            $each: [record],
            $slice: -10, // keep the most recent ten sessions
          },
        },
      },
    ).exec();
  }

  async rotateRefreshToken(
    id: string,
    previousHash: string,
    record: RefreshTokenRecord,
  ): Promise<void> {
    await UserModel.updateOne(
      { _id: id },
      {
        $pull: { refreshTokens: { tokenHash: previousHash } },
      },
    ).exec();
    await this.storeRefreshToken(id, record);
  }

  async revokeRefreshToken(id: string, tokenHash: string): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $pull: { refreshTokens: { tokenHash } } }).exec();
  }

  async revokeAllRefreshTokens(id: string): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { refreshTokens: [] } }).exec();
  }

  async registerSuccessfulLogin(id: string): Promise<void> {
    await UserModel.updateOne(
      { _id: id },
      { $set: { lastLogin: new Date(), loginAttempts: 0, lockedUntil: null } },
    ).exec();
  }

  async registerFailedLogin(id: string, attempts: number): Promise<void> {
    const update: Record<string, unknown> = { loginAttempts: attempts };
    if (attempts >= 5) {
      update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await UserModel.updateOne({ _id: id }, { $set: update }).exec();
  }

  async setPasswordReset(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { passwordReset: { tokenHash, expiresAt } } }).exec();
  }

  async findByPasswordResetToken(tokenHash: string): Promise<UserDocument | null> {
    return UserModel.findOne({
      'passwordReset.tokenHash': tokenHash,
      'passwordReset.expiresAt': { $gt: new Date() },
    }).exec() as Promise<UserDocument | null>;
  }

  async countByRole(roleName: string): Promise<number> {
    return UserModel.countDocuments({ role: roleName }).exec();
  }

  async countScoped(
    filter: Record<string, unknown>,
    roleNames: string[],
  ): Promise<number> {
    return UserModel.countDocuments({ ...filter, role: { $in: roleNames } }).exec();
  }
}

export const userRepository = new UserRepository();
