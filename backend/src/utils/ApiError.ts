import type { ApiErrorDetail } from '../types/api';

/** Application level error carrying an HTTP status code and safe, public details. */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: ApiErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: ApiErrorDetail[] = [],
    isOperational = true,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request', errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Validation failed', errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message = 'Too many requests, please try again later'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = 'Something went wrong'): ApiError {
    return new ApiError(500, message, [], false);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
