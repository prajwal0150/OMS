import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { auditLogService } from './auditLog.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const auditLogController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { items, meta } = await auditLogService.list(user, req.query as Record<string, unknown>);
    return ApiResponder.success(res, items, 'Audit logs retrieved', 200, { pagination: meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const log = await auditLogService.getById(user, String(req.params.id));
    return ApiResponder.success(res, log, 'Audit log entry retrieved');
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const summary = await auditLogService.summary(user, req.query as Record<string, unknown>);
    return ApiResponder.success(res, summary, 'Audit log summary retrieved');
  }),
};
