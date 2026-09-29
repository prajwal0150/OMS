import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../fetaures/Auth/redux/authSlice';
import organizationReducer from '../fetaures/Admin/Organization/redux/organizationSlice';
import districtReducer from '../fetaures/Admin/District/redux/districtSlice';
import unitsReducer from '../fetaures/Admin/Units/redux/unitSlice';
import communitiesReducer from '../fetaures/Admin/Communities/redux/communitySlice';
import membersReducer from '../fetaures/Admin/Members/redux/memberSlice';
import committeesReducer from '../fetaures/Admin/Committees/redux/committeeSlice';
import eventsReducer from '../fetaures/Admin/Events/redux/eventSlice';
import attendanceReducer from '../fetaures/Admin/Attendance/redux/attendanceSlice';
import contentReducer from '../fetaures/Admin/Content/redux/contentSlice';
import announcementsReducer from '../fetaures/Admin/Announcements/redux/announcementSlice';
import mediaReducer from '../fetaures/Admin/Media/redux/mediaSlice';
import documentsReducer from '../fetaures/Admin/Documents/redux/documentSlice';
import notificationsReducer from '../fetaures/Notifications/redux/notificationSlice';
import reportsReducer from '../fetaures/Admin/Reports/redux/reportSlice';
import administratorsReducer from '../fetaures/Admin/Administrators/redux/administratorSlice';
import auditLogsReducer from '../fetaures/Admin/AuditLogs/redux/auditLogSlice';
import dashboardReducer from '../fetaures/Admin/Dashboard/redux/dashboardSlice';

/**
 * Single global store. Feature state lives in
 * `src/fetaures/<Feature>/redux/` - there is deliberately no `src/redux/`.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    organization: organizationReducer,
    district: districtReducer,
    units: unitsReducer,
    communities: communitiesReducer,
    members: membersReducer,
    committees: committeesReducer,
    events: eventsReducer,
    attendance: attendanceReducer,
    content: contentReducer,
    announcements: announcementsReducer,
    media: mediaReducer,
    documents: documentsReducer,
    notifications: notificationsReducer,
    reports: reportsReducer,
    administrators: administratorsReducer,
    auditLogs: auditLogsReducer,
    dashboard: dashboardReducer,
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
