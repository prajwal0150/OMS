import type { NavSection } from './navigation';
import { SUPER_ADMIN_NAV_SECTIONS } from '../../SuperAdmin/config/navigation';
import { DISTRICT_ADMIN_NAV_SECTIONS } from '../../DistrictAdmin/config/navigation';
import { UNIT_ADMIN_NAV_SECTIONS } from '../../UnitAdmin/config/navigation';
import { ROLE } from '../../../../types';

/** The panel a role belongs to. Committee and member roles have no admin panel. */
export type AdminPanel = 'superAdmin' | 'districtAdmin' | 'unitAdmin';

export const panelNavSections: Record<AdminPanel, NavSection[]> = {
  superAdmin: SUPER_ADMIN_NAV_SECTIONS,
  districtAdmin: DISTRICT_ADMIN_NAV_SECTIONS,
  unitAdmin: UNIT_ADMIN_NAV_SECTIONS,
};

const PANEL_BY_ROLE: Record<string, AdminPanel> = {
  [ROLE.SUPER_ADMIN]: 'superAdmin',
  [ROLE.DISTRICT_ADMIN]: 'districtAdmin',
  [ROLE.UNIT_ADMIN]: 'unitAdmin',
};

/** Resolves a role to its panel, or null when the role has no admin panel. */
export const panelForRole = (role: string | null): AdminPanel | null =>
  role ? (PANEL_BY_ROLE[role] ?? null) : null;

/** The signed-in role's own navigation, before any permission filtering. */
export const sectionsForRole = (role: string | null): NavSection[] => {
  const panel = panelForRole(role);
  return panel ? panelNavSections[panel] : [];
};