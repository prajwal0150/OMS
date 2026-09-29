import type { Request, Response } from 'express';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { roleService } from './role.service';

export const roleController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await roleService.list(req.query as Record<string, unknown>);
    return ApiResponder.success(res, items, 'Roles retrieved', 200, { pagination: meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.getById(String(req.params.id));
    if (!role) throw ApiError.notFound('Role not found');
    return ApiResponder.success(res, role, 'Role retrieved');
  }),

  catalog: asyncHandler(async (_req: Request, res: Response) => {
    return ApiResponder.success(res, roleService.catalog(), 'Permission catalog retrieved');
  }),
};