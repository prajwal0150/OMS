import { refId } from '../../utils/strings';
import type { Request } from 'express';
import { ACCOUNT_STATUS, AUDIT_ACTION, MEMBER_STATUS } from '../../constants/enums';
import { ROLE_NAMES } from '../../constants/roles';
import type { AccountStatus } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { generateTemporaryPassword, hashPassword } from '../../utils/password';
import { assertWithinScope } from '../../shared/scope';
import { userAccessService } from '../users/access.service';
import { userRepository } from '../users/user.repository';
import { memberRepository } from './member.repository';
import { auditLogService } from '../auditLogs/auditLog.service';
import type { AuthUser } from '../../types/auth';

export interface CreateAccountInput {
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}

export interface CreatedAccountResult {
  account: Record<string, unknown>;
  temporaryPassword?: string;
}

/**
 * Member login accounts. Accounts are created by an administrator only â€”
 * there is no public registration anywhere. New accounts must change the
 * password on first sign in (`forcePasswordChange = true`).
 */
export class MemberAccountService {
  async createAccount(
    user: AuthUser,
    memberId: string,
    input: CreateAccountInput,
    request?: Request,
  ): Promise<CreatedAccountResult> {
    const member = await memberRepository.findByIdScoped(memberId, user, 'Member');
    assertWithinScope(
      user,
      { district: refId(member.district) as string, unit: refId(member.unit) ?? '' },
      'member accounts',
    );

    const email = (input.email ?? member.email ?? '').toLowerCase().trim();
    if (!email) {
      throw ApiError.badRequest('An email address is required to create a member account');
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) throw ApiError.conflict('An account with this email address already exists');

    const linked = await userRepository.findOne({ member: member._id });
    if (linked) throw ApiError.conflict('This member already has a login account');

    const role = input.role ?? ROLE_NAMES.MEMBER;
    if (role !== ROLE_NAMES.MEMBER && !user.isAdministrator) {
      throw ApiError.forbidden('Only administrators may assign a non member role');
    }

    const temporaryPassword = input.password ?? generateTemporaryPassword();
    const account = await userRepository.create({
      firstName: member.firstName,
      middleName: member.middleName,
      lastName: member.lastName,
      email,
      phone: input.phone ?? member.phone,
      passwordHash: await hashPassword(temporaryPassword),
      role,
      permissions: [],
      member: member._id,
      district: member.district,
      unit: member.unit,
      status: ACCOUNT_STATUS.ACTIVE,
      forcePasswordChange: true,
      createdBy: user.id,
      updatedBy: user.id,
    });

    if (member.status === MEMBER_STATUS.PENDING) {
      await memberRepository.updateById(String(member._id), { status: MEMBER_STATUS.ACTIVE });
    }

    await auditLogService.record({
      action: AUDIT_ACTION.MEMBER_CREATION,
      entity: 'MemberAccount',
      entityId: String(account._id),
      description: `Login account created for member ${member.memberId} (${email})`,
      user,
      request,
      district: refId(member.district),
      unit: refId(member.unit),
    });

    return {
      account: {
        id: String(account._id),
        email: account.email,
        status: account.status,
        role: account.role,
        forcePasswordChange: account.forcePasswordChange,
      },
      temporaryPassword,
    };
  }

  async listAccounts(user: AuthUser, query: Record<string, unknown>) {
    const filter: Record<string, unknown> = { role: ROLE_NAMES.MEMBER };
    if (typeof query.status === 'string' && query.status) filter.status = query.status;
    return userRepository.list(user, query, filter);
  }

  async getAccount(user: AuthUser, accountId: string): Promise<Record<string, unknown>> {
    const account = await userRepository.findByIdScoped(accountId, user, 'Account');
    return account as unknown as Record<string, unknown>;
  }

  async getAccountForMember(user: AuthUser, memberId: string) {
    const member = await memberRepository.findByIdScoped(memberId, user, 'Member');
    return userRepository.findOne({ member: member._id });
  }

  async setStatus(
    user: AuthUser,
    accountId: string,
    status: AccountStatus,
    request?: Request,
  ): Promise<Record<string, unknown>> {
    const account = await userRepository.findByIdScoped(accountId, user, 'Account');
    if (String(account._id) === user.id) {
      throw ApiError.forbidden('You cannot change the status of your own account');
    }
    await userRepository.updateById(String(account._id), {
      status,
      updatedBy: user.id,
      ...(status === ACCOUNT_STATUS.ACTIVE ? { loginAttempts: 0, lockedUntil: null } : {}),
    });
    if (status !== ACCOUNT_STATUS.ACTIVE) {
      await userRepository.revokeAllRefreshTokens(String(account._id));
    }
    await auditLogService.record({
      action:
        status === ACCOUNT_STATUS.ACTIVE ? AUDIT_ACTION.ACTIVATION : AUDIT_ACTION.DEACTIVATION,
      entity: 'MemberAccount',
      entityId: String(account._id),
      description: `Account ${account.email} set to ${status}`,
      user,
      request,
    });
    const refreshed = await userAccessService.getAuthUserById(String(account._id));
    return { id: String(account._id), status, user: refreshed };
  }

  async resetPassword(
    user: AuthUser,
    accountId: string,
    request?: Request,
  ): Promise<{ temporaryPassword: string }> {
    const account = await userRepository.findByIdScoped(accountId, user, 'Account');
    const temporaryPassword = generateTemporaryPassword();
    await userRepository.setPassword(String(account._id), await hashPassword(temporaryPassword));
    await userRepository.setForcePasswordChange(String(account._id), true);
    await userRepository.revokeAllRefreshTokens(String(account._id));
    await auditLogService.record({
      action: AUDIT_ACTION.PASSWORD_RESET,
      entity: 'MemberAccount',
      entityId: String(account._id),
      description: `Password reset by an administrator for ${account.email}`,
      user,
      request,
    });
    return { temporaryPassword };
  }
}

export const memberAccountService = new MemberAccountService();
