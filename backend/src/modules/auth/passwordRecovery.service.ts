import type { Request } from 'express';
import { AUDIT_ACTION } from '../../constants/enums';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { generateResetToken, hashPassword } from '../../utils/password';
import { hashToken } from '../../utils/token';
import { logger } from '../../utils/logger';
import { userRepository } from '../users/user.repository';
import { auditLogService } from '../auditLogs/auditLog.service';

/**
 * Password recovery. Responses never reveal whether an account exists.
 * When no mail transport is configured the token is returned in non production
 * environments only, which keeps the flow testable end to end.
 */
export class PasswordRecoveryService {
  async requestReset(email: string, req?: Request): Promise<{ token?: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.info(`Password reset requested for an unknown email address`);
      return {};
    }

    const { token, tokenHash, expiresAt } = generateResetToken();
    const userId = String(user._id);
    await userRepository.setPasswordReset(userId, tokenHash, expiresAt);
    await auditLogService.record({
      action: AUDIT_ACTION.PASSWORD_RESET,
      entity: 'Auth',
      entityId: userId,
      description: `Password reset requested for ${user.email}`,
      request: req,
    });

    return env.isProduction ? {} : { token };
  }

  async completeReset(
    input: { token: string; newPassword: string },
    req?: Request,
  ): Promise<void> {
    const user = await userRepository.findByPasswordResetToken(hashToken(input.token));
    if (!user) throw ApiError.badRequest('This password reset link is invalid or has expired');

    const userId = String(user._id);
    await userRepository.setPassword(userId, await hashPassword(input.newPassword));
    await userRepository.revokeAllRefreshTokens(userId);
    await auditLogService.record({
      action: AUDIT_ACTION.PASSWORD_RESET,
      entity: 'Auth',
      entityId: userId,
      description: `Password reset completed for ${user.email}`,
      request: req,
    });
  }
}

export const passwordRecoveryService = new PasswordRecoveryService();
