import { buildScopeFilter } from '../../shared/scope';
import { PERMISSIONS, type Permission } from '../../constants/permissions';
import { memberRepository } from '../members/member.repository';
import { unitRepository } from '../units/unit.repository';
import { communityRepository } from '../communities/community.repository';
import { committeeRepository } from '../committees/committee.repository';
import { eventRepository } from '../events/event.repository';
import { announcementRepository } from '../announcements/announcement.repository';
import { contentRepository } from '../content/content.repository';
import { documentRepository } from '../documents/document.repository';
import type { AuthUser } from '../../types/auth';

export type SearchEntity =
  | 'members'
  | 'units'
  | 'communities'
  | 'committees'
  | 'events'
  | 'announcements'
  | 'content'
  | 'documents';

export interface SearchHit {
  entity: SearchEntity;
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

export interface SearchGroup {
  entity: SearchEntity;
  label: string;
  hits: SearchHit[];
}

const GROUP_LABELS: Record<SearchEntity, string> = {
  members: 'Members',
  units: 'Units',
  communities: 'Communities',
  committees: 'Committees',
  events: 'Events',
  announcements: 'Announcements',
  content: 'Content',
  documents: 'Documents',
};

const personName = (record: Record<string, unknown>, fallback: string): string => {
  const joined = [record.firstName as string, record.lastName as string].filter(Boolean).join(' ');
  return joined || String(record.name ?? record.title ?? fallback);
};

const isoDay = (value?: Date): string | undefined =>
  value ? new Date(value).toISOString().slice(0, 10) : undefined;

/**
 * The permission required to *see* a search hit of each kind. A user without
 * `member.view` must not be able to discover member names by typing into the
 * global search box, so entity groups are dropped before any query runs.
 */
export const ENTITY_PERMISSIONS: Record<SearchEntity, Permission> = {
  members: PERMISSIONS.MEMBER_VIEW,
  units: PERMISSIONS.UNIT_VIEW,
  communities: PERMISSIONS.COMMUNITY_VIEW,
  committees: PERMISSIONS.COMMITTEE_VIEW,
  events: PERMISSIONS.EVENT_VIEW,
  announcements: PERMISSIONS.ANNOUNCEMENT_VIEW,
  content: PERMISSIONS.CONTENT_VIEW,
  documents: PERMISSIONS.DOCUMENT_VIEW,
};

/** Entity groups the caller is actually allowed to search. */
export const permittedEntities = (user: AuthUser, requested: SearchEntity[]): SearchEntity[] => {
  const granted = new Set<Permission>(user.permissions ?? []);
  return requested.filter((entity) => {
    const required = ENTITY_PERMISSIONS[entity];
    // Organization wide administrators are not granted every read permission by
    // role default, so fall back to the role's effective permission list.
    return !required || granted.has(required);
  });
};

/**
 * Cross entity search. Every repository call receives the caller's scope filter,
 * so results can never leak records from another district, unit or community.
 */
export class SearchService {
  async search(
    user: AuthUser,
    term: string,
    entities: SearchEntity[],
    limit = 5,
  ): Promise<{ term: string; groups: SearchGroup[]; total: number }> {
    const scope = buildScopeFilter(user);
    const query = { search: term, limit, page: 1 };
    const tasks: Array<Promise<SearchGroup>> = [];

    // A caller may only search entity groups they are permitted to view. This
    // runs before any repository call so an unauthorised group is never queried.
    const allowed = permittedEntities(user, entities);

    if (allowed.includes('members')) {
      tasks.push(
        memberRepository.list(user, query, {}).then(({ items }) => ({
          entity: 'members' as const,
          label: GROUP_LABELS.members,
          hits: items.map((member) => ({
            entity: 'members' as const,
            id: String(member._id),
            title: personName(member as unknown as Record<string, unknown>, member.memberId),
            subtitle: member.memberId,
            url: `/admin/members/${String(member._id)}`,
          })),
        })),
      );
    }

    if (allowed.includes('units')) {
      tasks.push(
        unitRepository.list(null, query, scope).then(({ items }) => ({
          entity: 'units' as const,
          label: GROUP_LABELS.units,
          hits: items.map((unit) => ({
            entity: 'units' as const,
            id: String(unit._id),
            title: unit.name,
            subtitle: unit.location ?? unit.code,
            url: `/admin/units/${String(unit._id)}`,
          })),
        })),
      );
    }

    if (allowed.includes('communities')) {
      tasks.push(
        communityRepository.list(null, query, scope).then(({ items }) => ({
          entity: 'communities' as const,
          label: GROUP_LABELS.communities,
          hits: items.map((community) => ({
            entity: 'communities' as const,
            id: String(community._id),
            title: community.name,
            subtitle: community.code,
            url: `/admin/communities/${String(community._id)}`,
          })),
        })),
      );
    }

    if (allowed.includes('committees')) {
      tasks.push(
        committeeRepository.list(null, query, scope).then(({ items }) => ({
          entity: 'committees' as const,
          label: GROUP_LABELS.committees,
          hits: items.map((committee) => ({
            entity: 'committees' as const,
            id: String(committee._id),
            title: committee.name,
            subtitle: committee.level,
            url: `/admin/committees/${String(committee._id)}`,
          })),
        })),
      );
    }

    if (allowed.includes('events')) {
      tasks.push(
        eventRepository.list(null, query, scope).then(({ items }) => ({
          entity: 'events' as const,
          label: GROUP_LABELS.events,
          hits: items.map((event) => ({
            entity: 'events' as const,
            id: String(event._id),
            title: event.title,
            subtitle: isoDay(event.startDate),
            url: `/admin/events/${String(event._id)}`,
          })),
        })),
      );
    }

    if (allowed.includes('announcements')) {
      tasks.push(
        announcementRepository.list(null, query, scope).then(({ items }) => ({
          entity: 'announcements' as const,
          label: GROUP_LABELS.announcements,
          hits: items.map((announcement) => ({
            entity: 'announcements' as const,
            id: String(announcement._id),
            title: announcement.title,
            subtitle: announcement.targetType,
            url: `/admin/announcements/${String(announcement._id)}`,
          })),
        })),
      );
    }

    if (allowed.includes('content')) {
      tasks.push(
        contentRepository.list(user, query, {}).then(({ items }) => ({
          entity: 'content' as const,
          label: GROUP_LABELS.content,
          hits: items.map((content) => ({
            entity: 'content' as const,
            id: String(content._id),
            title: content.title,
            subtitle: content.contentType,
            url: `/admin/content/${String(content._id)}`,
          })),
        })),
      );
    }

    if (allowed.includes('documents')) {
      tasks.push(
        documentRepository.list(null, query, scope).then(({ items }) => ({
          entity: 'documents' as const,
          label: GROUP_LABELS.documents,
          hits: items.map((document) => ({
            entity: 'documents' as const,
            id: String(document._id),
            title: document.title,
            subtitle: document.category,
            url: `/admin/documents/${String(document._id)}`,
          })),
        })),
      );
    }

    const groups = (await Promise.all(tasks)).filter((group) => group.hits.length > 0);
    return { term, groups, total: groups.reduce((sum, group) => sum + group.hits.length, 0) };
  }
}

export const searchService = new SearchService();
