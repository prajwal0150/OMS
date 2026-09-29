import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import type { ApiErrorDetail } from '../types/api';

interface MongoDuplicateError {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isDuplicateKeyError = (error: unknown): error is MongoDuplicateError =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;

const describeDuplicate = (error: MongoDuplicateError): string => {
  const field = Object.keys(error.keyValue ?? {})[0] ?? 'value';
  return `${field} already exists. Please use a different value.`;
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

/** Central error middleware â€” the only place that writes error responses. */
export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let details: ApiErrorDetail[] = [];

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.errors;
  } else if (error instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    details = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
      code: issue.code,
    }));
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation failed';
    details = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
  } else if (isDuplicateKeyError(error)) {
    statusCode = 409;
    message = describeDuplicate(error);
  } else if (error instanceof MulterError) {
    statusCode = 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'The uploaded file exceeds the maximum allowed size'
        : `Upload error: ${error.message}`;
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Malformed JSON payload';
  }

  if (statusCode >= 500) {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, error);
  }

  const body: Record<string, unknown> = { success: false, message, errors: details };
  if (!env.isProduction && statusCode >= 500 && error instanceof Error) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
};
