import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export const hashPassword = async (plainPassword: string): Promise<string> =>
  bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);

export const comparePassword = async (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(plainPassword, passwordHash);

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';

const pick = (source: string): string => source[crypto.randomInt(0, source.length)];

/** Generates a strong temporary password that satisfies the password policy. */
export const generateTemporaryPassword = (length = 12): string => {
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  while (required.length < length) required.push(pick(all));
  for (let index = required.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(0, index + 1);
    [required[index], required[swapIndex]] = [required[swapIndex], required[index]];
  }
  return required.join('');
};

export const generateResetToken = (): { token: string; tokenHash: string; expiresAt: Date } => {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };
};

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number and a special character.';

export const isStrongPassword = (password: string): boolean =>
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);
