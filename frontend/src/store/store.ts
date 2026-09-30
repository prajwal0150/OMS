import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../fetaures/Auth/redux/authSlice';
import notificationsReducer from '../fetaures/Notifications/redux/notificationSlice';

import superAdminOrganization from '../fetaures/Admin/SuperAdmin/Organization/redux/organizationSlice';
import superAdminDistrict from '../fetaures/Admin/SuperAdmin/District/redux/districtSlice';
import superAdminUnits from '../fetaures/Admin/SuperAdmin/Units/redux/unitSlice';
import superAdminCommunities from '../fetaures/Admin/SuperAdmin/Communities/redux/communitySlice';
import superAdminMembers from '../fetaures/Admin/SuperAdmin/Members/redux/memberSlice';
import superAdminCommittees from '../fetaures/Admin/SuperAdmin/Committees/redux/committeeSlice';
import superAdminEvents from '../fetaures/Admin/SuperAdmin/Events/redux/eventSlice';
import superAdminAttendance from '../fetaures/Admin/SuperAdmin/Attendance/redux/attendanceSlice';
import superAdminContent from '../fetaures/Admin/SuperAdmin/Content/redux/contentSlice';
import superAdminAnnouncements from '../fetaures/Admin/SuperAdmin/Announcements/redux/announcementSlice';
import superAdminAdministrators from '../fetaures/Admin/SuperAdmin/Administrators/redux/administratorSlice';
import superAdminAuditLogs from '../fetaures/Admin/SuperAdmin/AuditLogs/redux/auditLogSlice';
import superAdminReports from '../fetaures/Admin/SuperAdmin/Reports/redux/reportSlice';
import superAdminDashboard from '../fetaures/Admin/SuperAdmin/Dashboard/redux/dashboardSlice';

import districtUnits from '../fetaures/Admin/DistrictAdmin/Units/redux/unitSlice';
import districtCommunities from '../fetaures/Admin/DistrictAdmin/Communities/redux/communitySlice';
import districtMembers from '../fetaures/Admin/DistrictAdmin/Members/redux/memberSlice';
import districtCommittees from '../fetaures/Admin/DistrictAdmin/Committees/redux/committeeSlice';
import districtAdministrators from '../fetaures/Admin/DistrictAdmin/Administrators/redux/administratorSlice';
import districtEvents from '../fetaures/Admin/DistrictAdmin/Events/redux/eventSlice';
import districtAttendance from '../fetaures/Admin/DistrictAdmin/Attendance/redux/attendanceSlice';
import districtContent from '../fetaures/Admin/DistrictAdmin/Content/redux/contentSlice';
import districtAnnouncements from '../fetaures/Admin/DistrictAdmin/Announcements/redux/announcementSlice';
import districtReports from '../fetaures/Admin/DistrictAdmin/Reports/redux/reportSlice';
import districtDashboard from '../fetaures/Admin/DistrictAdmin/Dashboard/redux/dashboardSlice';

import unitCommunities from '../fetaures/Admin/UnitAdmin/Communities/redux/communitySlice';
import unitMembers from '../fetaures/Admin/UnitAdmin/Members/redux/memberSlice';
import unitCommittees from '../fetaures/Admin/UnitAdmin/Committees/redux/committeeSlice';
import unitEvents from '../fetaures/Admin/UnitAdmin/Events/redux/eventSlice';
import unitAttendance from '../fetaures/Admin/UnitAdmin/Attendance/redux/attendanceSlice';
import unitContent from '../fetaures/Admin/UnitAdmin/Content/redux/contentSlice';
import unitAnnouncements from '../fetaures/Admin/UnitAdmin/Announcements/redux/announcementSlice';
import unitReports from '../fetaures/Admin/UnitAdmin/Reports/redux/reportSlice';
import unitDashboard from '../fetaures/Admin/UnitAdmin/Dashboard/redux/dashboardSlice';

/**
 * Each admin panel owns a private branch of the store.
 *
 * The panels deliberately keep duplicate slices (see
 * `fetaures/Admin/<Panel>/`), so state cannot be shared under a single
 * `members` key. A panel reads and writes only its own branch; adding a field
 * to one panel's `Member` type cannot affect another panel's state shape.
 */
const superAdminReducer = combineReducers({
  organization: superAdminOrganization,
  district: superAdminDistrict,
  units: superAdminUnits,
  communities: superAdminCommunities,
  members: superAdminMembers,
  committees: superAdminCommittees,
  events: superAdminEvents,
  attendance: superAdminAttendance,
  content: superAdminContent,
  announcements: superAdminAnnouncements,
  administrators: superAdminAdministrators,
  auditLogs: superAdminAuditLogs,
  reports: superAdminReports,
  dashboard: superAdminDashboard,
});

const districtAdminReducer = combineReducers({
  units: districtUnits,
  communities: districtCommunities,
  members: districtMembers,
  committees: districtCommittees,
  administrators: districtAdministrators,
  events: districtEvents,
  attendance: districtAttendance,
  content: districtContent,
  announcements: districtAnnouncements,
  reports: districtReports,
  dashboard: districtDashboard,
});

const unitAdminReducer = combineReducers({
  communities: unitCommunities,
  members: unitMembers,
  committees: unitCommittees,
  events: unitEvents,
  attendance: unitAttendance,
  content: unitContent,
  announcements: unitAnnouncements,
  reports: unitReports,
  dashboard: unitDashboard,
});

/**
 * Single global store, with one branch per admin panel. Feature state lives in
 * `src/fetaures/Admin/<Panel>/<Feature>/redux/` - there is deliberately no
 * `src/redux/`.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    superAdmin: superAdminReducer,
    districtAdmin: districtAdminReducer,
    unitAdmin: unitAdminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // File uploads carry transient FormData/Blob references.
        ignoredActionPaths: ['meta.arg.file', 'payload.file'],
      },
    }),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
