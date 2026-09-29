import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Permission } from '../constants/permissions';
import type { RoleName } from '../constants/roles';
import { ApiError } from '../utils/ApiError';

/** Requires any one of the supplied roles. */
export const requireRole = (...roles: RoleName[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('Your role does not allow this action'));
      return;
    }
    next();
  };

/** Requires every supplied permission (AND). */
export const requirePermission = (...permissions: Permission[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    const missing = permissions.filter(
      (permission) => !req.user?.permissions.includes(permission),
    );
    if (missing.length > 0) {
      next(ApiError.forbidden(`Missing permission: ${missing.join(', ')}`));
      return;
    }
    next();
  };

/** Requires at least one of the supplied permissions (OR). */
export const requireAnyPermission = (...permissions: Permission[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    const granted = permissions.some((permission) =>
      req.user?.permissions.includes(permission),
    );
    if (!granted) {
      next(ApiError.forbidden(`Requires one of: ${permissions.join(', ')}`));
      return;
    }
    next();
  };

/** Administrative endpoints are closed to plain members. */
export const requireAdministrator: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }
  if (!req.user.isAdministrator) {
    next(ApiError.forbidden('Administrator access required'));
    return;
  }
  next();
};

/** Member portal endpoints are only available to accounts linked to a member. */
export const requireMemberAccount: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }
  if (!req.user.member) {
    next(ApiError.forbidden('This endpoint is only available to member accounts'));
    return;
  }
  next();
};

/** Super admin only (organization wide configuration and administration). */
export const requireSuperAdmin: RequestHandler = requireRole('SUPER_ADMIN');
