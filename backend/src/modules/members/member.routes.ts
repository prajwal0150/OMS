import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requireMemberAccount, requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { memberController } from './member.controller';
import {
  accountStatusSchema,
  createMemberAccountSchema,
  createMemberSchema,
  memberListQuerySchema,
  updateMemberSchema,
  updateOwnProfileSchema,
} from './member.validation';

export const memberRoutes = Router();

/* ---------- Member portal (own profile) ---------- */
memberRoutes.get('/me', authenticate, requireMemberAccount, memberController.ownProfile);
memberRoutes.patch(
  '/me',
  authenticate,
  requireMemberAccount,
  validateBody(updateOwnProfileSchema),
  memberController.updateOwnProfile,
);

/* ---------- Member account administration ---------- */
memberRoutes.get(
  '/accounts',
  authenticate,
  requirePermission(PERMISSIONS.MEMBER_ACCOUNT_VIEW),
  memberController.listAccounts,
);
memberRoutes.patch(
  '/accounts/:accountId/status',
  authenticate,
  requirePermission(PERMISSIONS.MEMBER_ACCOUNT_ACTIVATE, PERMISSIONS.MEMBER_ACCOUNT_DEACTIVATE),
  validateBody(accountStatusSchema),
  memberController.setAccountStatus,
);
memberRoutes.post(
  '/accounts/:accountId/reset-password',
  authenticate,
  requirePermission(PERMISSIONS.MEMBER_ACCOUNT_RESET_PASSWORD),
  memberController.resetAccountPassword,
);

/* ---------- Statistics ---------- */
memberRoutes.get(
  '/summary',
  authenticate,
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  memberController.summary,
);
memberRoutes.get(
  '/breakdowns',
  authenticate,
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  memberController.breakdowns,
);

/* ---------- Member records ---------- */
memberRoutes.post(
  '/:id/account',
  authenticate,
  requirePermission(PERMISSIONS.MEMBER_ACCOUNT_CREATE),
  validateBody(createMemberAccountSchema),
  memberController.createAccount,
);
memberRoutes.get(
  '/:id/account',
  authenticate,
  requirePermission(PERMISSIONS.MEMBER_ACCOUNT_VIEW),
  memberController.accountForMember,
);

memberRoutes.use(
  createCrudRouter({
    controller: memberController,
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.MEMBER_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.MEMBER_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.MEMBER_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.MEMBER_DELETE)],
    },
    validation: {
      list: [validateQuery(memberListQuerySchema)],
      create: [validateBody(createMemberSchema)],
      update: [validateBody(updateMemberSchema)],
    },
  }),
);
