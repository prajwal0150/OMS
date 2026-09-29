import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { AUDIT_ACTION } from '../../constants/enums';
import { makeCrudController } from '../../shared/crudController';
import { auditLogService } from '../auditLogs/auditLog.service';
import { documentService } from './document.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

const parseTags = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(String)
    : typeof value === 'string'
      ? value.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

export const documentController = {
  ...makeCrudController(documentService, 'Document'),

  listPublic: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await documentService.listPublic(
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Documents retrieved', 200, { pagination: meta });
  }),

  listForMember: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await documentService.listForMember(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Documents retrieved', 200, { pagination: meta });
  }),

  upload: asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const body = req.body as Record<string, unknown>;
    const document = await documentService.uploadDocument(user, req.uploadedFiles?.[0], {
      ...(typeof body.title === 'string' ? { title: body.title } : {}),
      ...(typeof body.description === 'string' ? { description: body.description } : {}),
      ...(typeof body.category === 'string' ? { category: body.category } : {}),
      ...(typeof body.visibility === 'string' ? { visibility: body.visibility } : {}),
      ...(typeof body.unit === 'string' ? { unit: body.unit } : {}),
      ...(typeof body.community === 'string' ? { community: body.community } : {}),
      ...(typeof body.committee === 'string' ? { committee: body.committee } : {}),
      ...(typeof body.event === 'string' ? { event: body.event } : {}),
      ...(typeof body.date === 'string' ? { date: body.date } : {}),
      tags: parseTags(body.tags),
    });

    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.CREATE,
      'Document',
      String((document as unknown as { _id: unknown })._id),
      `Document "${document.title}" uploaded`,
    );
    return ApiResponder.created(res, document, 'Document uploaded successfully');
  }),

  remove: asyncHandler(async (req, res: Response) => {
    await documentService.removeDocument(requireUser(req), String(req.params.id));
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.DELETE,
      'Document',
      String(req.params.id),
      'Document deleted',
    );
    return ApiResponder.success(res, null, 'Document deleted successfully');
  }),

  registerDownload: asyncHandler(async (req, res: Response) => {
    await documentService.registerDownload(String(req.params.id));
    return ApiResponder.success(res, null, 'Download recorded');
  }),

  categoryStats: asyncHandler(async (req, res: Response) => {
    const stats = await documentService.categoryStats(requireUser(req));
    return ApiResponder.success(res, stats, 'Document statistics retrieved');
  }),
};
