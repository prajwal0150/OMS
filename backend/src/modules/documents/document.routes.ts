import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { requireMemberAccount, requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { uploadSingle } from '../../middleware/upload';
import { uploadLimiter } from '../../middleware/rateLimit';
import { createCrudRouter } from '../../shared/crudRoutes';
import { documentController } from './document.controller';
import {
  documentListQuerySchema,
  updateDocumentSchema,
  uploadDocumentSchema,
} from './document.validation';

export const documentRoutes = Router();

documentRoutes.get('/public', validateQuery(documentListQuerySchema), documentController.listPublic);
documentRoutes.get(
  '/mine',
  authenticate,
  requireMemberAccount,
  documentController.listForMember,
);
documentRoutes.get(
  '/stats',
  authenticate,
  requirePermission(PERMISSIONS.DOCUMENT_VIEW),
  documentController.categoryStats,
);
documentRoutes.post(
  '/upload',
  authenticate,
  requirePermission(PERMISSIONS.DOCUMENT_CREATE),
  uploadLimiter,
  ...uploadSingle('document', 'file', 'documents'),
  validateBody(uploadDocumentSchema),
  documentController.upload,
);
documentRoutes.post('/:id/download', optionalAuthenticate, documentController.registerDownload);

documentRoutes.use(
  createCrudRouter({
    controller: { ...documentController, create: documentController.upload },
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.DOCUMENT_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.DOCUMENT_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.DOCUMENT_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.DOCUMENT_DELETE)],
    },
    validation: {
      list: [validateQuery(documentListQuerySchema)],
      update: [validateBody(updateDocumentSchema)],
    },
  }),
);
