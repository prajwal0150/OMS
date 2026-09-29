import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = <TRequest extends Request = Request>(
  handler: (req: TRequest, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    void handler(req as TRequest, res, next).catch(next);
  };
};
