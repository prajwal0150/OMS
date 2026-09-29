import { env } from '../../config/env';
import { PERMISSION_CATALOG } from '../../constants/permissionCatalog';
import { RECORD_STATUS } from '../../constants/enums';
import { buildScopeFilter, isSuperAdmin } from '../../shared/scope';
import type { AuthUser } from '../../types/auth';
import { organizationService } from '../organization/organization.service';
import { userDirectoryService } from '../users/user.service';
import { memberStatsService } from '../members/memberStats.service';
import { unitRepository } from '../units/unit.repository';
import { communityRepository } from '../communities/community.repository';
import { committeeRepository } from '../committees/committee.repository';
import { eventRepository } from '../events/event.repository';
import { contentRepository } from '../content/content.repository';
import { auditLogService } from '../auditLogs/auditLog.service';

export interface PlatformSettings {
  organization: Record<string, unknown> | null;
  scope: { district: string | null; unit: string | null; community: string | null };
  totals: {
    units: number;
    communities: number;
    committees: number;
    events: number;
    content: number;
    members: number;
  };
  members: Awaited<ReturnType<typeof memberStatsService.statusSummary>>;
  roles: Awaited<ReturnType<typeof userDirectoryService.roleBreakdown>>;
  security: {
    permissions: number;
    tokenExpiries: { access: string; refresh: string };
    rateLimiting: boolean;
    storageProvider: string;
  };
  recentActivity: Awaited<ReturnType<typeof auditLogService.list>> extends { items: infer T }
    ? T
    : never;
  environment: string;
}

/** Read-only platform settings, always scoped to the caller. */
export class SettingsService {
  async overview(user: AuthUser) {
    const scope = buildScopeFilter(user);
    const [organization, members, roles, units, communities, committees, events, content, recent] =
      await Promise.all([
        organizationService.getPublicProfile().catch(() => null),
        memberStatsService.statusSummary(user),
        userDirectoryService.roleBreakdown(user),
        unitRepository.count(null, scope),
        communityRepository.count(null, scope),
        committeeRepository.count(null, scope),
        eventRepository.count(null, scope),
        contentRepository.count(user, {}),
        auditLogService.list(user, { page: 1, limit: 12, sort: 'createdAt', order: 'desc' }),
      ]);

    return {
      organization,
      scope: {
        district: user.district ?? null,
        unit: user.unit ?? null,
        community: user.community ?? null,
        level: isSuperAdmin(user) ? 'ORGANIZATION' : (user.unit ? 'UNIT' : 'DISTRICT'),
      },
      totals: {
        units,
        communities,
        committees,
        events,
        content,
        members: members.total,
      },
      members,
      roles,
      security: {
        permissions: PERMISSION_CATALOG.length,
        tokenExpiries: { access: env.JWT_ACCESS_EXPIRES_IN, refresh: env.JWT_REFRESH_EXPIRES_IN },
        rateLimiting: true,
        storageProvider: env.STORAGE_PROVIDER,
      },
      recentActivity: recent.items,
      environment: env.NODE_ENV,
      defaultStatus: RECORD_STATUS.ACTIVE,
    };
  }
}

export const settingsService = new SettingsService();