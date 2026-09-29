import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { communityController } from './community.controller';
import {
  communityListQuerySchema,
  createCommunitySchema,
  updateCommunitySchema,
} from './community.validation';

export const communityRoutes = Router();

communityRoutes.get('/public', communityController.listPublic);
communityRoutes.get('/public/:id', communityController.getPublic);
communityRoutes.get(
  '/options',
  authenticate,
  requirePermission(PERMISSIONS.COMMUNITY_VIEW),
  communityController.options,
);

communityRoutes.use(
  createCrudRouter({
    controller: communityController,
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.COMMUNITY_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.COMMUNITY_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.COMMUNITY_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.COMMUNITY_DELETE)],
    },
    validation: {
      list: [validateQuery(communityListQuerySchema)],
      create: [validateBody(createCommunitySchema)],
      update: [validateBody(updateCommunitySchema)],
    },
  }),
);
