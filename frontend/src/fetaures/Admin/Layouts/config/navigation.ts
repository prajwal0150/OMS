import type { LucideIcon } from 'lucide-react';

/**
 * Navigation contract shared by every admin panel.
 *
 * Each panel owns its own `navigation.ts` - a plain, readable list of exactly
 * what that role can open. The sidebar renders only that list, so "what can a
 * District Admin see?" is answered by reading one file instead of evaluating
 * permissions against a single master list.
 *
 * The permission checks below are a second gate, not the first: the backend
 * independently enforces permissions and organizational scope.
 */
export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Any one of these permissions grants access. */
  permissions?: string[];
  /** Every one of these permissions is required. */
  allPermissions?: string[];
  /** Restricts the item to specific roles. */
  roles?: string[];
  end?: boolean;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export interface NavVisibilityContext {
  permissions: string[];
  role: string | null;
}

/** True when the signed-in account may see (and open) a navigation item. */
export const canSeeNavItem = (item: NavItem, context: NavVisibilityContext): boolean => {
  if (item.roles && context.role && !item.roles.includes(context.role)) return false;
  if (item.permissions && item.permissions.length > 0) {
    return item.permissions.some((permission) => context.permissions.includes(permission));
  }
  if (item.allPermissions && item.allPermissions.length > 0) {
    return item.allPermissions.every((permission) => context.permissions.includes(permission));
  }
  return true;
};

/** Filters one panel's own sections for the signed-in account. */
export const visibleSections = (
  sections: NavSection[],
  context: NavVisibilityContext,
): NavSection[] =>
  sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canSeeNavItem(item, context)),
    }))
    .filter((section) => section.items.length > 0);

/** Flat list of everything visible - used by the mobile drawer and search. */
export const visibleItems = (sections: NavSection[], context: NavVisibilityContext): NavItem[] =>
  visibleSections(sections, context).flatMap((section) => section.items);