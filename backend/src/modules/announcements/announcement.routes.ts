import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requireMemberAccount, requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { announcementController } from './announcement.controller';
import {
  announcementListQuerySchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from './announcement.validation';

export const announcementRoutes = Router();

announcementRoutes.get('/public', announcementController.listPublic);
announcementRoutes.get('/public/:id', announcementController.getPublicById);
announcementRoutes.get('/mine', authenticate, requireMemberAccount, announcementController.listForMember);
announcementRoutes.get(
  '/monthly',
  authenticate,
  requirePermission(PERMISSIONS.ANNOUNCEMENT_VIEW),
  announcementController.monthly,
);

announcementRoutes.use(
  createCrudRouter({
    controller: announcementController,
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENT_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENT_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENT_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENT_DELETE)],
    },
    validation: {
      list: [validateQuery(announcementListQuerySchema)],
      create: [validateBody(createAnnouncementSchema)],
      update: [validateBody(updateAnnouncementSchema)],
    },
  }),
);
