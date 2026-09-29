import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { makeCrudController } from '../../shared/crudController';
import { contentService } from './content.service';
import { contentPublishingService } from './contentPublishing.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const contentController = {
  ...makeCrudController(contentService, 'Content'),

  /* ---------- Public website ---------- */
  listPublic: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await contentService.listPublic(req.query as Record<string, unknown>);
    return ApiResponder.success(res, items, 'Content retrieved', 200, { pagination: meta });
  }),

  getPublicBySlug: asyncHandler(async (req, res: Response) => {
    const content = await contentService.getPublicBySlug(String(req.params.slug));
    return ApiResponder.success(res, content, 'Content retrieved');
  }),

  gallery: asyncHandler(async (req, res: Response) => {
    const items = await contentService.publicGallery(req.query as Record<string, unknown>);
    return ApiResponder.success(res, items, 'Gallery retrieved');
  }),

  /* ---------- Member portal ---------- */
  listForMember: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await contentService.listForMember(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Content retrieved', 200, { pagination: meta });
  }),

  /* ---------- Statistics ---------- */
  stats: asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const [byStatus, byType, monthly] = await Promise.all([
      contentService.statusBreakdown(user),
      contentService.typeBreakdown(user),
      contentService.monthly(user, Number(req.query.months ?? 12)),
    ]);
    return ApiResponder.success(res, { byStatus, byType, monthly }, 'Content statistics retrieved');
  }),

  /* ---------- Publishing workflow ---------- */
  submit: asyncHandler(async (req, res: Response) => {
    const content = await contentPublishingService.submit(
      requireUser(req),
      String(req.params.id),
      req,
    );
    return ApiResponder.success(res, content, 'Content submitted for review');
  }),

  approve: asyncHandler(async (req, res: Response) => {
    const { notes } = req.body as { notes?: string };
    const content = await contentPublishingService.approve(
      requireUser(req),
      String(req.params.id),
      notes,
      req,
    );
    return ApiResponder.success(res, content, 'Content approved');
  }),

  reject: asyncHandler(async (req, res: Response) => {
    const { reason } = req.body as { reason?: string };
    const content = await contentPublishingService.reject(
      requireUser(req),
      String(req.params.id),
      reason ?? 'Content requires changes',
      req,
    );
    return ApiResponder.success(res, content, 'Content rejected');
  }),

  publish: asyncHandler(async (req, res: Response) => {
    const { scheduledAt, notes } = req.body as { scheduledAt?: Date; notes?: string };
    const content = await contentPublishingService.publish(
      requireUser(req),
      String(req.params.id),
      { scheduledAt, notes },
      req,
    );
    return ApiResponder.success(
      res,
      content,
      scheduledAt ? 'Content scheduled for publishing' : 'Content published successfully',
    );
  }),

  unpublish: asyncHandler(async (req, res: Response) => {
    const content = await contentPublishingService.unpublish(
      requireUser(req),
      String(req.params.id),
      req,
    );
    return ApiResponder.success(res, content, 'Content unpublished');
  }),

  archive: asyncHandler(async (req, res: Response) => {
    const content = await contentPublishingService.archive(
      requireUser(req),
      String(req.params.id),
      req,
    );
    return ApiResponder.success(res, content, 'Content archived');
  }),
};
