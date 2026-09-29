import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { AUDIT_ACTION } from '../../constants/enums';
import { auditLogService } from '../auditLogs/auditLog.service';
import { districtService } from './district.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const districtController = {
  list: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await districtService.list(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'District list retrieved', 200, { pagination: meta });
  }),

  getById: asyncHandler(async (req, res: Response) => {
    const district = await districtService.getById(requireUser(req), String(req.params.id));
    return ApiResponder.success(res, district, 'District retrieved');
  }),

  create: asyncHandler(async (req, res: Response) => {
    const district = await districtService.create(
      requireUser(req),
      req.body as Record<string, unknown>,
    );
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.CREATE,
      'District',
      String(district._id),
      `District ${district.name} created`,
    );
    return ApiResponder.created(res, district, 'District created successfully');
  }),

  update: asyncHandler(async (req, res: Response) => {
    const district = await districtService.update(
      requireUser(req),
      String(req.params.id),
      req.body as Record<string, unknown>,
    );
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.UPDATE,
      'District',
      String(district._id),
      `District ${district.name} updated`,
    );
    return ApiResponder.success(res, district, 'District updated successfully');
  }),

  publicProfile: asyncHandler(async (_req, res: Response) => {
    const district = await districtService.getPublicProfile();
    return ApiResponder.success(res, district, 'District retrieved');
  }),
};
