import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { uploadLimiter } from '../../middleware/rateLimit';
import { uploadMany, uploadSingle } from '../../middleware/upload';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { mediaController } from './media.controller';
import { mediaAttachSchema, mediaListQuerySchema, mediaUpdateSchema } from './media.validation';

export const mediaRoutes = Router();

mediaRoutes.get('/public', validateQuery(mediaListQuerySchema), mediaController.listPublic);

mediaRoutes.get(
  '/stats',
  authenticate,
  requirePermission(PERMISSIONS.MEDIA_VIEW),
  mediaController.storageStats,
);

mediaRoutes.post(
  '/upload',
  authenticate,
  requirePermission(PERMISSIONS.MEDIA_CREATE),
  uploadLimiter,
  ...uploadMany('media', 'files', 12, 'media'),
  mediaController.upload,
);

mediaRoutes.post(
  '/upload-single',
  authenticate,
  requirePermission(PERMISSIONS.MEDIA_CREATE),
  uploadLimiter,
  ...uploadSingle('media', 'file', 'media'),
  mediaController.upload,
);

mediaRoutes.post(
  '/attach',
  authenticate,
  requirePermission(PERMISSIONS.MEDIA_CREATE),
  validateBody(mediaAttachSchema),
  mediaController.attach,
);

mediaRoutes.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MEDIA_CREATE),
  validateBody(mediaUpdateSchema),
  mediaController.update,
);

mediaRoutes.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MEDIA_DELETE),
  mediaController.remove,
);

mediaRoutes.use(
  createCrudRouter({
    controller: {
      ...mediaController,
      create: mediaController.upload,
      remove: mediaController.remove,
    },
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.MEDIA_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.MEDIA_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.MEDIA_CREATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.MEDIA_DELETE)],
    },
    validation: { list: [validateQuery(mediaListQuerySchema)] },
  }),
);
