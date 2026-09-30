import { loadDashboard as loadSuperAdminDashboard } from '../../SuperAdmin/Dashboard/redux/dashboardThunk';
import { loadDashboard as loadDistrictAdminDashboard } from '../../DistrictAdmin/Dashboard/redux/dashboardThunk';
import { loadDashboard as loadUnitAdminDashboard } from '../../UnitAdmin/Dashboard/redux/dashboardThunk';
import { panelForRole, type AdminPanel } from './panelNavigation';

/**
 * Loads the dashboard belonging to the signed-in role's panel.
 *
 * Each panel has its own copy of the dashboard feature, so the header has to
 * pick the right thunk rather than importing one shared implementation.
 */
export type PanelDashboardAction =
  | ReturnType<typeof loadSuperAdminDashboard>
  | ReturnType<typeof loadDistrictAdminDashboard>
  | ReturnType<typeof loadUnitAdminDashboard>;

const LOADERS: Record<AdminPanel, () => PanelDashboardAction> = {
  superAdmin: () => loadSuperAdminDashboard(undefined),
  districtAdmin: () => loadDistrictAdminDashboard(undefined),
  unitAdmin: () => loadUnitAdminDashboard(undefined),
};

/** Null when the signed-in role has no admin panel (member, committee). */
export const loadPanelDashboard = (role: string | null): PanelDashboardAction | null => {
  const panel = panelForRole(role);
  return panel ? LOADERS[panel]() : null;
};