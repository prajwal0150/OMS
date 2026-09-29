import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { administratorService } from './administrator.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const administratorController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await administratorService.list(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Administrators retrieved', 200, {
      pagination: meta,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const account = await administratorService.getById(requireUser(req), String(req.params.id));
    return ApiResponder.success(res, account, 'Administrator retrieved');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await administratorService.create(
      requireUser(req),
      req.body as Record<string, never>,
      req,
    );
    return ApiResponder.created(res, result, 'Administrator account created successfully');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const account = await administratorService.update(
      requireUser(req),
      String(req.params.id),
      req.body as Record<string, never>,
      req,
    );
    return ApiResponder.success(res, account, 'Administrator account updated successfully');
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' };
    const result = await administratorService.setStatus(
      requireUser(req),
      String(req.params.id),
      status,
      req,
    );
    return ApiResponder.success(res, result, 'Administrator status updated');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await administratorService.resetPassword(
      requireUser(req),
      String(req.params.id),
      req,
    );
    return ApiResponder.success(res, result, 'Password reset — share the temporary password securely');
  }),

  /* ---------- Roles & permissions ---------- */

  listRoles: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await administratorService.listRoles(
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Roles retrieved', 200, { pagination: meta });
  }),

  getRole: asyncHandler(async (req: Request, res: Response) => {
    const role = await administratorService.getRole(String(req.params.id));
    return ApiResponder.success(res, role, 'Role retrieved');
  }),

  updateRolePermissions: asyncHandler(async (req: Request, res: Response) => {
    const { permissions } = req.body as { permissions: string[] };
    const role = await administratorService.updateRolePermissions(
      requireUser(req),
      String(req.params.id),
      permissions,
      req,
    );
    return ApiResponder.success(res, role, 'Role permissions updated');
  }),

  permissionCatalog: asyncHandler(async (_req: Request, res: Response) => {
    return ApiResponder.success(
      res,
      administratorService.permissionCatalog(),
      'Permission catalog retrieved',
    );
  }),
};
