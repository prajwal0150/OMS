import type { Request, Response } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { userDirectoryService } from './user.service';
import type { AuthUser } from '../../types/auth';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await userDirectoryService.list(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Users retrieved', 200, { pagination: meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const account = await userDirectoryService.getById(requireUser(req), String(req.params.id));
    return ApiResponder.success(res, account, 'User retrieved');
  }),

  options: asyncHandler(async (req: Request, res: Response) => {
    const options = await userDirectoryService.options(requireUser(req));
    return ApiResponder.success(res, options, 'User options retrieved');
  }),

  roleBreakdown: asyncHandler(async (req: Request, res: Response) => {
    const breakdown = await userDirectoryService.roleBreakdown(requireUser(req));
    return ApiResponder.success(res, breakdown, 'User role breakdown retrieved');
  }),
};

export const USER_MANAGE_PERMISSION = PERMISSIONS.USER_MANAGE;