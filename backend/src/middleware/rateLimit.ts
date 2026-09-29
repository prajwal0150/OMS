import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const buildHandler = (message: string) => (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) => {
  res.status(429).json({ success: false, message, errors: [] });
};

/** Global API limiter. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 600 : 5000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildHandler('Too many requests, please try again later'),
});

/** Strict limiter for credential endpoints (login, refresh, password reset). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 20 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: buildHandler('Too many authentication attempts, please try again in a few minutes'),
});

/** Upload limiter. */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: env.isProduction ? 200 : 2000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildHandler('Too many uploads, please slow down'),
});
