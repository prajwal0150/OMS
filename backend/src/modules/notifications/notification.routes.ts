import { z } from 'zod';
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validateQuery } from '../../middleware/validate';
import { paginationSchema } from '../../shared/validation';
import { notificationController } from './notification.controller';

export const notificationListQuerySchema = paginationSchema.extend({
  isRead: z.enum(['true', 'false']).optional(),
  type: z.string().optional(),
});

export const notificationRoutes = Router();

notificationRoutes.get(
  '/',
  authenticate,
  validateQuery(notificationListQuerySchema),
  notificationController.list,
);
notificationRoutes.get('/unread-count', authenticate, notificationController.unreadCount);
notificationRoutes.patch('/read-all', authenticate, notificationController.markAllRead);
notificationRoutes.patch('/:id/read', authenticate, notificationController.markRead);
notificationRoutes.delete('/:id', authenticate, notificationController.remove);

