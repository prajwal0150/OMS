import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { roleController } from './role.controller';

/** Database backed roles. Maintenance happens through /administrators/roles/:id/permissions. */
export const roleRoutes = Router();

roleRoutes.get('/', authenticate, roleController.list);
roleRoutes.get('/catalog', authenticate, roleController.catalog);
roleRoutes.get('/:id', authenticate, roleController.getById);