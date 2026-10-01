/**
 * Super Admin provisioning (scripts/seedSuperAdmin.ts).
 *
 * Regression coverage for the bug that made the seed useless for its most
 * common recovery job. `seedSuperAdmin` used to `return existingSuperAdmin`
 * before it had even read SUPER_ADMIN_PASSWORD, so once any Super Admin row
 * existed the password in .env was silently ignored: the seed reported success
 * and sign-in still failed with "Invalid email or password".
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { seedSuperAdmin } from '../scripts/seedSuperAdmin';
import { ROLE_NAMES } from '../src/constants/roles';
import { UserModel } from '../src/modules/users/user.model';
import { comparePassword, hashPassword } from '../src/utils/password';

const EMAIL = 'reset.super.admin@hps.test';
const ORIGINAL_PASSWORD = 'OriginalPass@2026';
const NEW_PASSWORD = 'Replacement@2026';

const options = (password: string, resetPassword: boolean) => ({
  email: EMAIL,
  password,
  firstName: 'Super',
  lastName: 'Admin',
  resetPassword,
});

const storeSuperAdmin = async (password: string) => {
  await UserModel.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: EMAIL,
    passwordHash: await hashPassword(password),
    role: ROLE_NAMES.SUPER_ADMIN,
    permissions: [],
    status: 'ACTIVE',
    forcePasswordChange: false,
  });
};

/** Reads the hash back with the explicit select that passwordHash requires. */
const storedHash = async (): Promise<string> => {
  const user = await UserModel.findOne({ email: EMAIL }).select('+passwordHash');
  return user!.passwordHash;
};

describe('Super Admin seeding', () => {
  beforeEach(async () => {
    await UserModel.deleteMany({ role: ROLE_NAMES.SUPER_ADMIN });
  });

  it('creates the account when none exists', async () => {
    const outcome = await seedSuperAdmin(options(ORIGINAL_PASSWORD, false));

    expect(outcome.action).toBe('created');
    expect(await storedHash()).toBeTruthy();
    expect(await comparePassword(ORIGINAL_PASSWORD, await storedHash())).toBe(true);
  });

  it('leaves an existing password alone on an ordinary re-run', async () => {
    // This is the exact scenario that trapped the operator: the password in
    // .env was changed and the seed re-run, which changed nothing at all.
    await storeSuperAdmin(ORIGINAL_PASSWORD);

    const outcome = await seedSuperAdmin(options(NEW_PASSWORD, false));

    expect(outcome.action).toBe('unchanged');
    expect(await comparePassword(ORIGINAL_PASSWORD, await storedHash())).toBe(true);
    expect(await comparePassword(NEW_PASSWORD, await storedHash())).toBe(false);
  });

  it('re-hashes the new password when the reset is explicitly requested', async () => {
    await storeSuperAdmin(ORIGINAL_PASSWORD);

    const outcome = await seedSuperAdmin(options(NEW_PASSWORD, true));

    expect(outcome.action).toBe('reset');
    expect(await comparePassword(NEW_PASSWORD, await storedHash())).toBe(true);
    expect(await comparePassword(ORIGINAL_PASSWORD, await storedHash())).toBe(false);
  });

  it('clears the lockout so a correct password is not still rejected', async () => {
    // registerFailedLogin locks an account for 15 minutes after 5 attempts, and
    // that lock outlives a password reset unless it is cleared explicitly.
    await storeSuperAdmin(ORIGINAL_PASSWORD);
    await UserModel.updateOne(
      { email: EMAIL },
      { $set: { loginAttempts: 5, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } },
    );

    await seedSuperAdmin(options(NEW_PASSWORD, true));

    const user = await UserModel.findOne({ email: EMAIL });
    expect(user!.loginAttempts).toBe(0);
    expect(user!.lockedUntil).toBeUndefined();
  });

  it('re-arms the forced password change on a reset', async () => {
    // The operator is expected to replace the seeded password, so a reset must
    // put the account back into that state rather than leaving it satisfied.
    await storeSuperAdmin(ORIGINAL_PASSWORD);
    await UserModel.updateOne({ email: EMAIL }, { $set: { forcePasswordChange: false } });

    await seedSuperAdmin(options(NEW_PASSWORD, true));

    const user = await UserModel.findOne({ email: EMAIL });
    expect(user!.forcePasswordChange).toBe(true);
    expect(user!.passwordChangedAt).toBeInstanceOf(Date);
  });

  it('never creates a second Super Admin', async () => {
    await seedSuperAdmin(options(ORIGINAL_PASSWORD, false));
    await seedSuperAdmin(options(ORIGINAL_PASSWORD, false));

    expect(await UserModel.countDocuments({ role: ROLE_NAMES.SUPER_ADMIN })).toBe(1);
  });

  it('refuses a reset with no password instead of blanking the account', async () => {
    await storeSuperAdmin(ORIGINAL_PASSWORD);

    await expect(seedSuperAdmin(options('', true))).rejects.toThrow(
      /SUPER_ADMIN_PASSWORD/,
    );
    expect(await comparePassword(ORIGINAL_PASSWORD, await storedHash())).toBe(true);
  });

  it('normalises the seeded email address', async () => {
    const outcome = await seedSuperAdmin({
      ...options(ORIGINAL_PASSWORD, false),
      email: '  MiXeD.Case@HPS.test  ',
    });

    expect(outcome.email).toBe('mixed.case@hps.test');
    expect(await UserModel.countDocuments({ email: 'mixed.case@hps.test' })).toBe(1);
  });
});