import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';

const toErrorDetails = (error: { issues: Array<{ path: Array<string | number>; message: string; code: string }> }) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
    code: issue.code,
  }));

/** Validates and replaces `req.body` with the parsed payload. */
export const validateBody = (schema: ZodTypeAny): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(ApiError.unprocessable('Validation failed', toErrorDetails(result.error)));
      return;
    }
    req.body = result.data;
    next();
  };

/** Validates query parameters and merges the coerced values into `req.query`. */
export const validateQuery = (schema: ZodTypeAny): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(ApiError.unprocessable('Invalid query parameters', toErrorDetails(result.error)));
      return;
    }
    Object.assign(req.query as Record<string, unknown>, result.data as Record<string, unknown>);
    next();
  };

/** Validates route params (e.g. Mongo identifiers). */
export const validateParams = (schema: ZodTypeAny): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(ApiError.badRequest('Invalid request parameters', toErrorDetails(result.error)));
      return;
    }
    Object.assign(req.params, result.data as Record<string, unknown>);
    next();
  };
