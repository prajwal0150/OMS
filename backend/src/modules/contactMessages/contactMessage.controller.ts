import type { Request, Response } from 'express';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { contactMessageService } from './contactMessage.service';
import type {
  CreateContactMessageInput,
  UpdateContactMessageInput,
} from './contactMessage.validation';

/** Best effort client IP, honouring a single proxy hop. */
const clientIp = (req: Request): string | undefined => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim();
  }
  return req.ip;
};

export const contactMessageController = {
  /** Public, unauthenticated. Returns a reference id only. */
  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await contactMessageService.submit(
      req.body as CreateContactMessageInput,
      {
        ipAddress: clientIp(req),
        userAgent: req.headers['user-agent'],
      },
    );
    return ApiResponder.created(
      res,
      result,
      'Thank you. Your message has been received and we will reply shortly.',
    );
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await contactMessageService.list(
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Messages retrieved', 200, { pagination: meta });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const record = await contactMessageService.get(String(req.params.id));
    return ApiResponder.success(res, record, 'Message retrieved');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const updated = await contactMessageService.update(
      String(req.params.id),
      req.body as UpdateContactMessageInput,
    );
    return ApiResponder.success(res, updated, 'Message updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await contactMessageService.remove(String(req.params.id));
    return ApiResponder.noContent(res);
  }),
};
