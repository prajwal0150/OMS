import type { Request } from 'express';
import { ACCOUNT_STATUS, AUDIT_ACTION } from '../../constants/enums';
import type { AccountStatus } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { comparePassword, hashPassword } from '../../utils/password';
import { verifyRefreshToken } from '../../utils/token';
import type { AuthUser, LoginResult } from '../../types/auth';
import { userRepository } from '../users/user.repository';
import { userAccessService } from '../users/access.service';
import { auditLogService } from '../auditLogs/auditLog.service';
import { sessionService } from './session.service';
import { passwordRecoveryService } from './passwordRecovery.service';
import type { ChangePasswordInput, LoginInput } from './auth.validation';

const statusMessage = (status: AccountStatus): string => {
  switch (status) {
    case ACCOUNT_STATUS.PENDING:
      return 'Your account is pending activation by an administrator';
    case ACCOUNT_STATUS.INACTIVE:
      return 'Your account is inactive. Please contact an administrator';
    case ACCOUNT_STATUS.SUSPENDED:
      return 'Your account has been suspended. Please contact an administrator';
    default:
      return 'Your account is not allowed to sign in';
  }
};

const displayName = (user: AuthUser): string =>
  `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

/** Authentication. There is no public registration anywhere in the platform. */
export class AuthService {
  async login(input: LoginInput, req?: Request): Promise<LoginResult> {
    const user = await userRepository.findForAuthentication(input.email);

    if (!user) {
      await auditLogService.record({
        action: AUDIT_ACTION.LOGIN_FAILED,
        entity: 'Auth',
        description: `Failed sign in attempt for ${input.email}`,
        request: req,
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw ApiError.forbidden('Too many failed attempts. Your account is locked for 15 minutes');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      await userRepository.registerFailedLogin(user.id, (user.loginAttempts ?? 0) + 1);
      await auditLogService.record({
        action: AUDIT_ACTION.LOGIN_FAILED,
        entity: 'Auth',
        entityId: user.id,
        description: `Failed sign in attempt for ${user.email}`,
        request: req,
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== ACCOUNT_STATUS.ACTIVE) {
      await auditLogService.record({
        action: AUDIT_ACTION.LOGIN_FAILED,
        entity: 'Auth',
        entityId: user.id,
        description: `Blocked sign in for ${user.email} (${user.status})`,
        request: req,
      });
      throw ApiError.forbidden(statusMessage(user.status));
    }

    const authUser = await userAccessService.buildAuthUser(user);
    const tokens = await sessionService.issue(authUser, req);
    await userRepository.registerSuccessfulLogin(user.id);
    await auditLogService.record({
      action: AUDIT_ACTION.LOGIN,
      entity: 'Auth',
      entityId: user.id,
      description: `${displayName(authUser)} signed in`,
      user: authUser,
      request: req,
    });

    return { user: authUser, ...tokens, forcePasswordChange: authUser.forcePasswordChange };
  }

  /** Rotates a refresh token; a reused or revoked token invalidates all sessions. */
  async refresh(refreshToken: string, req?: Request): Promise<LoginResult> {
    const payload = verifyRefreshToken(refreshToken);
    const sessionHash = sessionService.hash(refreshToken);
    const user = await userRepository.findByIdWithSecrets(payload.sub);
    if (!user) throw ApiError.unauthorized('Session no longer valid');

    const stored = (user.refreshTokens ?? []).find((record) => record.tokenHash === sessionHash);
    if (!stored) {
      await userRepository.revokeAllRefreshTokens(user.id);
      throw ApiError.unauthorized('Session expired, please sign in again');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      await userRepository.revokeRefreshToken(user.id, sessionHash);
      throw ApiError.unauthorized('Session expired, please sign in again');
    }
    if (user.status !== ACCOUNT_STATUS.ACTIVE) {
      throw ApiError.forbidden(statusMessage(user.status));
    }

    const authUser = await userAccessService.buildAuthUser(user);
    const tokens = await sessionService.rotate(authUser, refreshToken, req);
    return { user: authUser, ...tokens, forcePasswordChange: authUser.forcePasswordChange };
  }

  async logout(user: AuthUser, refreshToken?: string, req?: Request): Promise<void> {
    await sessionService.revoke(user.id, refreshToken);
    await auditLogService.record({
      action: AUDIT_ACTION.LOGOUT,
      entity: 'Auth',
      entityId: user.id,
      description: `${displayName(user)} signed out`,
      user,
      request: req,
    });
  }

  async me(user: AuthUser): Promise<AuthUser> {
    const fresh = await userAccessService.getAuthUserById(user.id);
    if (!fresh) throw ApiError.unauthorized('Account no longer available');
    return fresh;
  }

  async changePassword(
    user: AuthUser,
    input: ChangePasswordInput,
    req?: Request,
  ): Promise<{ forcePasswordChange: false }> {
    const account = await userRepository.findByIdWithSecrets(user.id);
    if (!account) throw ApiError.unauthorized();

    const matches = await comparePassword(input.currentPassword, account.passwordHash);
    if (!matches) throw ApiError.badRequest('Your current password is incorrect');

    if (await comparePassword(input.newPassword, account.passwordHash)) {
      throw ApiError.badRequest('The new password must be different from the current password');
    }

    await userRepository.setPassword(account.id, await hashPassword(input.newPassword));
    await auditLogService.record({
      action: AUDIT_ACTION.PASSWORD_CHANGE,
      entity: 'Auth',
      entityId: account.id,
      description: 'Password changed by the account owner',
      user,
      request: req,
    });
    return { forcePasswordChange: false };
  }

  forgotPassword(email: string, req?: Request): Promise<{ token?: string }> {
    return passwordRecoveryService.requestReset(email, req);
  }

  resetPassword(input: { token: string; newPassword: string }, req?: Request): Promise<void> {
    return passwordRecoveryService.completeReset(input, req);
  }
}

export const authService = new AuthService();
