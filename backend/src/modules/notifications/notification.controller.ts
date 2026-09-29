import type { Request, Response } from 'express';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { notificationService } from './notification.service';

const requireUserId = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const notificationController = {
  list: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await notificationService.list(
      requireUserId(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Notifications retrieved', 200, { pagination: meta });
  }),

  unreadCount: asyncHandler(async (req, res: Response) => {
    const count = await notificationService.unreadCount(requireUserId(req));
    return ApiResponder.success(res, { unread: count }, 'Unread notifications retrieved');
  }),

  markRead: asyncHandler(async (req, res: Response) => {
    const updated = await notificationService.markRead(
      requireUserId(req),
      String(req.params.id),
    );
    if (!updated) throw ApiError.notFound('Notification not found');
    return ApiResponder.success(res, { read: true }, 'Notification marked as read');
  }),

  markAllRead: asyncHandler(async (req, res: Response) => {
    const count = await notificationService.markAllRead(requireUserId(req));
    return ApiResponder.success(res, { updated: count }, 'All notifications marked as read');
  }),

  remove: asyncHandler(async (req, res: Response) => {
    await notificationService.remove(requireUserId(req), String(req.params.id));
    return ApiResponder.success(res, null, 'Notification deleted');
  }),
};
