import type { Response } from 'express';
import type { ApiMeta, ApiSuccessBody } from '../types/api';

export class ApiResponder {
  static success<T>(
    res: Response,
    data: T,
    message = 'Operation successful',
    statusCode = 200,
    meta?: ApiMeta,
  ): Response<ApiSuccessBody<T>> {
    const body: ApiSuccessBody<T> = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully') {
    return ApiResponder.success(res, data, message, 201);
  }

  static noContent(res: Response, message = 'Operation successful') {
    return res.status(200).json({ success: true, message, data: null });
  }
}

export const successResponse = ApiResponder.success;
export const createdResponse = ApiResponder.created;
