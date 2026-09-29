import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import type { ExportFormat, ReportType } from '../../constants/enums';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { reportService } from './report.service';
import { reportAnalyticsService } from './reportAnalytics.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

/** Supertest buffers text responses — make sure binary payloads always stream. */
const coerceBody = (buffer: Buffer | string): Buffer =>
  typeof buffer === 'string' ? Buffer.from(buffer, 'utf8') : buffer;

export const reportController = {
  /* ---- Report generation & export ---- */
  generate: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { type, format, saveRecord, ...filters } = req.body as {
      type: ReportType;
      format: ExportFormat;
      saveRecord?: boolean;
      [key: string]: unknown;
    };

    const result = await reportService.generate(user, type, format, filters, {
      saveRecord: saveRecord ?? true,
    });

    const body = coerceBody(result.buffer);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', String(body.length));
    return res.end(body);
  }),

  preview: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { type, ...filters } = req.query as {
      type: ReportType;
      [key: string]: unknown;
    };

    if (!type) {
      throw ApiError.badRequest('Report type is required');
    }

    const payload = await reportService.preview(user, type, filters);
    return ApiResponder.success(res, payload, 'Report preview generated');
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const { items, meta } = await reportService.history(user, req.query as Record<string, unknown>);
    return ApiResponder.success(res, items, 'Report history retrieved', 200, { pagination: meta });
  }),

  downloadSaved: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const record = await reportService.getSaved(user, String(req.params.id));
    return ApiResponder.success(res, record, 'Report record retrieved');
  }),

  deleteSaved: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await reportService.deleteSaved(user, String(req.params.id));
    return ApiResponder.noContent(res);
  }),

  /* ---- Analytics endpoints ---- */
  dashboard: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await reportAnalyticsService.dashboard(user, req.query as Record<string, unknown>);
    return ApiResponder.success(res, data, 'Dashboard analytics retrieved');
  }),

  districtSummary: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await reportAnalyticsService.districtSummary(user);
    return ApiResponder.success(res, data, 'District summary retrieved');
  }),

  unitBreakdown: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await reportAnalyticsService.unitBreakdown(user, req.query as Record<string, unknown>);
    return ApiResponder.success(res, data, 'Unit breakdown retrieved');
  }),

  communityBreakdown: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await reportAnalyticsService.communityBreakdown(user, req.query as Record<string, unknown>);
    return ApiResponder.success(res, data, 'Community breakdown retrieved');
  }),

  membershipTrend: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const months = req.query.months ? Number(req.query.months) : 12;
    const data = await reportAnalyticsService.membershipTrend(user, months);
    return ApiResponder.success(res, data, 'Membership trend retrieved');
  }),
};
