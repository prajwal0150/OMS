import type { Request, Response } from 'express';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { permissionService } from './permission.service';

export const permissionController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await permissionService.list(req.query as Record<string, unknown>);
    return ApiResponder.success(res, items, 'Permissions retrieved', 200, { pagination: meta });
  }),

  grouped: asyncHandler(async (_req: Request, res: Response) => {
    return ApiResponder.success(res, await permissionService.grouped(), 'Permissions retrieved');
  }),
};