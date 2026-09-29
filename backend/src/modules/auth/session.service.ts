import type { Request } from 'express';
import { env } from '../../config/env';
import type { AuthUser } from '../../types/auth';
import {
  hashToken,
  refreshTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
} from '../../utils/token';
import { userRepository } from '../users/user.repository';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
}

/** Owns access/refresh token issuing and refresh token rotation. */
export class SessionService {
  async issue(authUser: AuthUser, req?: Request): Promise<SessionTokens> {
    const accessToken = signAccessToken({ sub: authUser.id, role: authUser.role });
    const refreshToken = signRefreshToken({ sub: authUser.id, role: authUser.role });

    await userRepository.storeRefreshToken(authUser.id, {
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
      createdAt: new Date(),
      userAgent: req?.headers['user-agent']?.slice(0, 300),
      ipAddress: req?.ip,
    });

    return { accessToken, refreshToken, accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN };
  }

  async rotate(
    authUser: AuthUser,
    previousToken: string,
    req?: Request,
  ): Promise<SessionTokens> {
    const previousHash = hashToken(previousToken);
    const accessToken = signAccessToken({ sub: authUser.id, role: authUser.role });
    const refreshToken = signRefreshToken({ sub: authUser.id, role: authUser.role });

    await userRepository.rotateRefreshToken(authUser.id, previousHash, {
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
      createdAt: new Date(),
      userAgent: req?.headers['user-agent']?.slice(0, 300),
      ipAddress: req?.ip,
    });

    return { accessToken, refreshToken, accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN };
  }

  async revoke(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await userRepository.revokeRefreshToken(userId, hashToken(refreshToken));
      return;
    }
    await userRepository.revokeAllRefreshTokens(userId);
  }

  hash(token: string): string {
    return hashToken(token);
  }
}

export const sessionService = new SessionService();
