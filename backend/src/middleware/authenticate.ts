import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ACCOUNT_STATUS } from '../constants/enums';
import { userAccessService } from '../modules/users/access.service';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/token';

const extractBearer = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
};

/** Verifies the access token and loads a fresh access profile from the database. */
export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractBearer(req);
    if (!token) {
      next(ApiError.unauthorized());
      return;
    }
    const payload = verifyAccessToken(token);
    const user = await userAccessService.loadActiveAuthUser(payload.sub);
    if (!user) {
      next(ApiError.unauthorized('Your account is inactive or the session has expired'));
      return;
    }
    if (user.status !== ACCOUNT_STATUS.ACTIVE) {
      next(ApiError.forbidden('Your account is not active'));
      return;
    }
    req.user = user;
    req.scope = {
      ...(user.district ? { district: user.district } : {}),
      ...(user.unit ? { unit: user.unit } : {}),
      ...(user.community ? { community: user.community } : {}),
      ...(user.committee ? { committee: user.committee } : {}),
    };
    next();
  } catch (error) {
    next(error);
  }
};

/** Attaches the user when a valid token is present but never rejects the request. */
export const optionalAuthenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractBearer(req);
    if (!token) {
      next();
      return;
    }
    const payload = verifyAccessToken(token);
    const user = await userAccessService.loadActiveAuthUser(payload.sub);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
};
