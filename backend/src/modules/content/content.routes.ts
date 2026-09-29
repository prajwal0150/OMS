import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requireMemberAccount, requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { contentController } from './content.controller';
import {
  contentListQuerySchema,
  createContentSchema,
  publicContentQuerySchema,
  publishContentSchema,
  reviewContentSchema,
  submitContentSchema,
  updateContentSchema,
} from './content.validation';

export const contentRoutes = Router();

/* ---------- Public website ---------- */
contentRoutes.get('/public', validateQuery(publicContentQuerySchema), contentController.listPublic);
contentRoutes.get('/public/gallery', contentController.gallery);
contentRoutes.get('/public/:slug', contentController.getPublicBySlug);

/* ---------- Member portal (visibility aware) ---------- */
contentRoutes.get('/mine', authenticate, requireMemberAccount, contentController.listForMember);

/* ---------- Statistics ---------- */
contentRoutes.get(
  '/stats',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_VIEW),
  contentController.stats,
);

/* ---------- Publishing workflow ---------- */
contentRoutes.post(
  '/:id/submit',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_CREATE, PERMISSIONS.CONTENT_UPDATE),
  validateBody(submitContentSchema),
  contentController.submit,
);
contentRoutes.post(
  '/:id/approve',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_APPROVE),
  validateBody(reviewContentSchema),
  contentController.approve,
);
contentRoutes.post(
  '/:id/reject',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_APPROVE),
  validateBody(reviewContentSchema),
  contentController.reject,
);
contentRoutes.post(
  '/:id/publish',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_PUBLISH),
  validateBody(publishContentSchema),
  contentController.publish,
);
contentRoutes.post(
  '/:id/unpublish',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_PUBLISH),
  contentController.unpublish,
);
contentRoutes.post(
  '/:id/archive',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_UPDATE),
  contentController.archive,
);

contentRoutes.use(
  createCrudRouter({
    controller: contentController,
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.CONTENT_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.CONTENT_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.CONTENT_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.CONTENT_DELETE)],
    },
    validation: {
      list: [validateQuery(contentListQuerySchema)],
      create: [validateBody(createContentSchema)],
      update: [validateBody(updateContentSchema)],
    },
  }),
);
