import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types/auth';
import { ApiError } from './ApiError';

const ACCESS: 'access' = 'access';
const REFRESH: 'refresh' = 'refresh';

export const createJti = (): string => crypto.randomBytes(24).toString('hex');

export const signAccessToken = (payload: { sub: string; role: JwtPayload['role'] }) =>
  jwt.sign({ ...payload, type: ACCESS, jti: createJti() }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);

export const signRefreshToken = (payload: { sub: string; role: JwtPayload['role'] }) =>
  jwt.sign({ ...payload, type: REFRESH, jti: createJti() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);

const verify = (token: string, secret: string, expectedType: 'access' | 'refresh'): JwtPayload => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (decoded.type !== expectedType) {
      throw ApiError.unauthorized('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Session expired, please sign in again');
    }
    throw ApiError.unauthorized('Invalid or malformed token');
  }
};

export const verifyAccessToken = (token: string): JwtPayload =>
  verify(token, env.JWT_ACCESS_SECRET, ACCESS);

export const verifyRefreshToken = (token: string): JwtPayload =>
  verify(token, env.JWT_REFRESH_SECRET, REFRESH);

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const refreshTokenExpiryDate = (): Date => {
  const parsed = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_EXPIRES_IN.trim());
  const now = Date.now();
  if (!parsed) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const amount = Number(parsed[1]);
  const unit = parsed[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(now + amount * (multipliers[unit] ?? 86400000));
};

export { ACCESS as ACCESS_TOKEN_TYPE, REFRESH as REFRESH_TOKEN_TYPE };
