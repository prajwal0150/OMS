import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { AUDIT_ACTION } from '../../constants/enums';
import { makeCrudController } from '../../shared/crudController';
import { auditLogService } from '../auditLogs/auditLog.service';
import { announcementService } from './announcement.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const announcementController = {
  ...makeCrudController(announcementService, 'Announcement'),

  listPublic: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await announcementService.listPublic(
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Announcements retrieved', 200, { pagination: meta });
  }),

  getPublicById: asyncHandler(async (req, res: Response) => {
    const announcement = await announcementService.getPublicById(String(req.params.id));
    return ApiResponder.success(res, announcement, 'Announcement retrieved');
  }),

  listForMember: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await announcementService.listForMember(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Announcements retrieved', 200, { pagination: meta });
  }),

  monthly: asyncHandler(async (req, res: Response) => {
    const trend = await announcementService.monthly(
      requireUser(req),
      Number(req.query.months ?? 12),
    );
    return ApiResponder.success(res, trend, 'Announcement activity retrieved');
  }),

  create: asyncHandler(async (req, res: Response) => {
    const announcement = await announcementService.create(
      requireUser(req),
      req.body as Record<string, unknown>,
    );
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.CREATE,
      'Announcement',
      String((announcement as unknown as { _id: unknown })._id),
      'Announcement created',
    );
    return ApiResponder.created(res, announcement, 'Announcement created successfully');
  }),
};
