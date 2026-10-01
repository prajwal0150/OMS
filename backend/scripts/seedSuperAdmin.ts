/**
 * Super Admin provisioning, extracted from the seed script so it can be covered
 * by tests. `seed.ts` runs on import, which made this logic impossible to test
 * without spawning a subprocess.
 *
 * The rule this implements: a Super Admin is created once and then left alone.
 * A plain re-run of the seed must never change the password of an account that
 * already exists, because the operator is expected to replace it through the
 * forced-password-change flow. Password resets are therefore opt-in via
 * RESET_SUPER_ADMIN_PASSWORD.
 */
import type { UserDocument } from '../src/modules/users/user.model';
import { ROLE_NAMES } from '../src/constants/roles';
import { UserModel } from '../src/modules/users/user.model';
import { hashPassword } from '../src/utils/password';

export interface SeedSuperAdminOptions {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Re-hash `password` onto an existing account instead of leaving it alone. */
  resetPassword: boolean;
}

export type SeedSuperAdminOutcome =
  | { action: 'created'; email: string; user: UserDocument }
  | { action: 'unchanged'; email: string; user: UserDocument }
  | { action: 'reset'; email: string; user: UserDocument };

export const seedSuperAdmin = async (
  options: SeedSuperAdminOptions,
): Promise<SeedSuperAdminOutcome> => {
  const email = options.email.trim().toLowerCase();
  const { password } = options;

  const existingSuperAdmin = await UserModel.findOne({ role: ROLE_NAMES.SUPER_ADMIN });

  if (existingSuperAdmin) {
    if (!options.resetPassword) {
      return { action: 'unchanged', email: existingSuperAdmin.email, user: existingSuperAdmin };
    }

    if (!password) {
      throw new Error(
        'RESET_SUPER_ADMIN_PASSWORD=true needs SUPER_ADMIN_PASSWORD set in backend/.env.',
      );
    }

    // The lockout counter is cleared alongside the password. Five failed
    // attempts lock the account for 15 minutes, so without this a correct reset
    // would still be rejected with "Too many failed attempts".
    await UserModel.updateOne(
      { _id: existingSuperAdmin._id },
      {
        $set: {
          passwordHash: await hashPassword(password),
          passwordChangedAt: new Date(),
          forcePasswordChange: true,
          loginAttempts: 0,
        },
        $unset: { lockedUntil: 1, passwordReset: 1 },
      },
    ).exec();

    // Re-read rather than returning the pre-update document: the caller seeds
    // demo data attributed to this user and must not observe a stale row.
    const reset = await UserModel.findById(existingSuperAdmin._id);
    if (!reset) throw new Error('Super Admin vanished during the password reset.');

    return { action: 'reset', email: reset.email, user: reset };
  }

  if (!email || !password) {
    throw new Error(
      'No Super Admin exists yet. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in backend/.env, then run the seed again.',
    );
  }

  const created = await UserModel.create({
    firstName: options.firstName,
    lastName: options.lastName,
    email,
    passwordHash: await hashPassword(password),
    role: ROLE_NAMES.SUPER_ADMIN,
    permissions: [],
    status: 'ACTIVE',
    // The seeded account must set its own password on first sign-in.
    forcePasswordChange: true,
    isSystemAccount: true,
  });

  return { action: 'created', email: created.email, user: created };
};
