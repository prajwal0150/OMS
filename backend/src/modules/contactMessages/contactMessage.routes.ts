import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { contactMessageController } from './contactMessage.controller';
import {
  contactMessageListQuerySchema,
  createContactMessageSchema,
  updateContactMessageSchema,
} from './contactMessage.validation';

export const contactMessageRoutes = Router();

/**
 * Public submission endpoint. It is intentionally unauthenticated and
 * rate limited per IP; the honeypot field absorbs naive bots.
 */
contactMessageRoutes.post(
  '/',
  validateBody(createContactMessageSchema),
  contactMessageController.create,
);

/** Everything below requires an authenticated administrator. */
contactMessageRoutes.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  validateQuery(contactMessageListQuerySchema),
  contactMessageController.list,
);

contactMessageRoutes.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  contactMessageController.get,
);

contactMessageRoutes.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  validateBody(updateContactMessageSchema),
  contactMessageController.update,
);

contactMessageRoutes.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  contactMessageController.remove,
);
