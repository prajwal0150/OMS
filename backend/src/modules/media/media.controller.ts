import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { AUDIT_ACTION } from '../../constants/enums';
import { makeCrudController } from '../../shared/crudController';
import { auditLogService } from '../auditLogs/auditLog.service';
import { mediaService } from './media.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const mediaController = {
  ...makeCrudController(mediaService, 'Media'),

  listPublic: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await mediaService.listPublic(req.query as Record<string, unknown>);
    return ApiResponder.success(res, items, 'Media retrieved', 200, { pagination: meta });
  }),

  upload: asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const files = req.uploadedFiles ?? [];
    const metadata = {
      ...(typeof req.body.title === 'string' ? { title: req.body.title } : {}),
      ...(typeof req.body.alt === 'string' ? { alt: req.body.alt } : {}),
      ...(typeof req.body.caption === 'string' ? { caption: req.body.caption } : {}),
      ...(typeof req.body.category === 'string' ? { category: req.body.category } : {}),
      ...(typeof req.body.tags === 'string'
        ? { tags: req.body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) }
        : {}),
    };

    const media = await mediaService.uploadFiles(user, files, metadata);
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.CREATE,
      'Media',
      String((media[0] as unknown as { _id: unknown })?._id ?? ''),
      `${media.length} media file(s) uploaded`,
    );
    return ApiResponder.created(res, media, 'Media uploaded successfully');
  }),

  update: asyncHandler(async (req, res: Response) => {
    const media = await mediaService.update(
      requireUser(req),
      String(req.params.id),
      req.body as Record<string, unknown>,
    );
    return ApiResponder.success(res, media, 'Media updated successfully');
  }),

  remove: asyncHandler(async (req, res: Response) => {
    await mediaService.removeMedia(requireUser(req), String(req.params.id));
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.DELETE,
      'Media',
      String(req.params.id),
      'Media deleted',
    );
    return ApiResponder.success(res, null, 'Media deleted successfully');
  }),

  attach: asyncHandler(async (req, res: Response) => {
    const { mediaIds, entity, entityId } = req.body as {
      mediaIds: string[];
      entity: string;
      entityId: string;
    };
    const result = await mediaService.attach(requireUser(req), mediaIds, entity, entityId);
    return ApiResponder.success(res, result, 'Media attached successfully');
  }),

  storageStats: asyncHandler(async (req, res: Response) => {
    const stats = await mediaService.storageStats(requireUser(req));
    return ApiResponder.success(res, stats, 'Media statistics retrieved');
  }),
};
