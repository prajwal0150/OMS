import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { authService } from './auth.service';

export const REFRESH_COOKIE_NAME = 'hps_refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.isProduction,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const readRefreshToken = (req: Request): string | undefined => {
  const fromCookie = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
  const fromBody = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  return fromBody ?? fromCookie;
};

const requireUser = (req: Request) => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const authController = {
  login: asyncHandler(async (req, res: Response) => {
    const result = await authService.login(
      req.body as { email: string; password: string },
      req,
    );
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
    return ApiResponder.success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessTokenExpiresIn: result.accessTokenExpiresIn,
        forcePasswordChange: result.forcePasswordChange,
      },
      'Signed in successfully',
    );
  }),

  refresh: asyncHandler(async (req, res: Response) => {
    const token = readRefreshToken(req);
    if (!token) throw ApiError.unauthorized('Refresh token missing');
    const result = await authService.refresh(token, req);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
    return ApiResponder.success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessTokenExpiresIn: result.accessTokenExpiresIn,
        forcePasswordChange: result.forcePasswordChange,
      },
      'Session refreshed',
    );
  }),

  logout: asyncHandler(async (req, res: Response) => {
    await authService.logout(requireUser(req), readRefreshToken(req), req);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    return ApiResponder.success(res, null, 'Signed out successfully');
  }),

  me: asyncHandler(async (req, res: Response) => {
    const user = await authService.me(requireUser(req));
    return ApiResponder.success(res, user, 'Profile retrieved');
  }),

  changePassword: asyncHandler(async (req, res: Response) => {
    const result = await authService.changePassword(
      requireUser(req),
      req.body as { currentPassword: string; newPassword: string },
      req,
    );
    return ApiResponder.success(res, result, 'Password updated successfully');
  }),

  forgotPassword: asyncHandler(async (req, res: Response) => {
    const { token } = await authService.forgotPassword(
      (req.body as { email: string }).email,
      req,
    );
    return ApiResponder.success(
      res,
      token ? { token } : {},
      'If the email address belongs to an account, a password reset link has been sent',
    );
  }),

  resetPassword: asyncHandler(async (req, res: Response) => {
    await authService.resetPassword(
      req.body as { token: string; newPassword: string },
      req,
    );
    return ApiResponder.success(
      res,
      null,
      'Password has been reset. You can now sign in with your new password',
    );
  }),
};
