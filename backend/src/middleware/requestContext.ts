import crypto from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/** Adds a correlation id and a lightweight access log entry. */
export const requestContext: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const headerId = req.headers['x-request-id'];
  const requestId = typeof headerId === 'string' && headerId.length > 0
    ? headerId
    : crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startedAt = Date.now();
  res.on('finish', () => {
    if (env.isTest) return;
    const duration = Date.now() - startedAt;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    if (res.statusCode >= 500) logger.error(line);
    else if (res.statusCode >= 400) logger.warn(line);
    else if (env.isDevelopment) logger.debug(line);
  });

  next();
};
