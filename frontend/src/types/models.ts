import type {
  AccountStatus,
  CommitteeLevel,
  CommitteePosition,
  CommunityTargetGroup,
  EventLevel,
  EventStatus,
  EventType,
  Gender,
  MembershipType,
  MemberStatus,
  RecordStatus,
  RoleName,
} from './enums';
import type {
  AuditAction,
  ContentStatus,
  ContentType,
  DocumentCategory,
  ContactStatus,
  ExportFormat,
  MediaCategory,
  NotificationType,
  ReportType,
  TargetType,
  Visibility,
  VideoType,
} from './contentEnums';
import type { AttendanceStatus } from './enums';

export type { Permission } from './permissions';

/** A populated reference: either a bare id or the joined document. */
export interface Ref {
  _id: string;
  name?: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  memberId?: string;
}

export type MaybeRef = Ref | string | null | undefined;

export const refId = (value: MaybeRef): string | undefined =>
  typeof value === 'string' ? value : value?._id;

export const refName = (value: MaybeRef): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return undefined;
  if (value.name) return value.name;
  if (value.memberId) return value.memberId;
  const joined = [value.firstName, value.lastName].filter(Boolean).join(' ');
  return joined || value.email || undefined;
};

export interface Timestamps {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser extends Timestamps {
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: RoleName;
  permissions: string[];
  member?: string | null;
  district?: string | null;
  unit?: string | null;
  community?: string | null;
  committee?: string | null;
  status: AccountStatus;
  forcePasswordChange: boolean;
  isAdministrator: boolean;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  forcePasswordChange: boolean;
}

export interface Organization extends Timestamps {
  name: string;
  shortName?: string;
  slug: string;
  logo?: string;
  description?: string;
  establishedDate?: string;
  district?: MaybeRef;
  province: string;
  country: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  };
  active: boolean;
}

export interface District extends Timestamps {
  name: string;
  code: string;
  province: string;
  country: string;
  description?: string;
  organization?: MaybeRef;
  contact?: { phone?: string; email?: string; address?: string };
  status: RecordStatus;
}

export interface Unit extends Timestamps {
  name: string;
  code: string;
  description?: string;
  location?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  district: MaybeRef;
  organization?: MaybeRef;
  status: RecordStatus;
  establishedDate?: string;
}

export interface Community extends Timestamps {
  name: string;
  code: string;
  description?: string;
  targetGroup: CommunityTargetGroup;
  ageGroup?: string;
  district: MaybeRef;
  unit?: MaybeRef;
  organization?: MaybeRef;
  coordinator?: MaybeRef;
  status: RecordStatus;
}

export interface CommitteePositionEntry extends Timestamps {
  position: CommitteePosition;
  member?: MaybeRef;
  user?: MaybeRef;
  assignedDate?: string;
  endDate?: string;
  remarks?: string;
  active: boolean;
}

export interface Committee extends Timestamps {
  name: string;
  level: CommitteeLevel;
  description?: string;
  district: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  organization?: MaybeRef;
  positions?: CommitteePositionEntry[];
  startDate?: string;
  endDate?: string;
  status: RecordStatus;
}

export interface EventRecord extends Timestamps {
  title: string;
  description?: string;
  type: EventType;
  level: EventLevel;
  organizer?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status: EventStatus;
  coverImage?: string;
  documents?: MaybeRef[];
  district: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  committee?: MaybeRef;
  organization?: MaybeRef;
}

export interface AttendanceRecord extends Timestamps {
  member: MaybeRef;
  event: MaybeRef;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
  district?: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  markedBy?: MaybeRef;
}

export interface Announcement extends Timestamps {
  title: string;
  content: string;
  image?: string;
  attachment?: MaybeRef;
  targetType: TargetType;
  district?: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  committee?: MaybeRef;
  selectedMembers?: MaybeRef[];
  organization?: MaybeRef;
  publishDate: string;
  expiryDate?: string;
  status: RecordStatus;
  isPublic: boolean;
}

export interface GalleryImage {
  _id?: string;
  url: string;
  caption?: string;
  alt?: string;
  order: number;
  isCover: boolean;
}

export interface ContentVideo {
  _id?: string;
  videoType: VideoType;
  videoUrl: string;
  thumbnail?: string;
  caption?: string;
}

export interface ContentRecord extends Timestamps {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  contentType: ContentType;
  coverImage?: string;
  gallery?: GalleryImage[];
  videos?: ContentVideo[];
  documents?: MaybeRef[];
  author?: MaybeRef;
  publishedBy?: MaybeRef;
  approvedBy?: MaybeRef;
  organization?: MaybeRef;
  district: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  committee?: MaybeRef;
  event?: MaybeRef;
  visibility: Visibility;
  status: ContentStatus;
  reviewNotes?: string;
  rejectionReason?: string;
  publishedAt?: string;
  scheduledAt?: string;
  views?: number;
  tags?: string[];
}

export interface MediaItem extends Timestamps {
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  storageKey: string;
  storageProvider: string;
  thumbnailUrl?: string;
  category: MediaCategory;
  title?: string;
  alt?: string;
  caption?: string;
  tags?: string[];
  uploadedBy?: MaybeRef;
  district?: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
}

export interface DocumentFile extends Timestamps {
  title: string;
  description?: string;
  file: { url: string; key: string; name: string; type: string; size: number };
  category: DocumentCategory;
  uploadedBy?: MaybeRef;
  district?: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  committee?: MaybeRef;
  event?: MaybeRef;
  visibility: Visibility;
  date: string;
  tags?: string[];
  downloadCount?: number;
}

/** A message submitted through the public contact page. */
export interface ContactMessage extends Timestamps {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  ipAddress?: string;
  userAgent?: string;
  readAt?: string;
  repliedAt?: string;
  replyNote?: string;
  assignedTo?: MaybeRef;
}

export interface NotificationItem extends Timestamps {
  recipient: MaybeRef;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  entity?: string;
  entityId?: string;
  district?: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  isRead: boolean;
  readAt?: string;
}

export interface AuditLogEntry {
  _id: string;
  user?: MaybeRef;
  userLabel?: string;
  userRole?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  description?: string;
  district?: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  ipAddress?: string;
  requestId?: string;
  createdAt: string;
}

export interface RoleRecord {
  _id: string;
  name: RoleName;
  label: string;
  description?: string;
  permissions: string[];
  permissionCount: number;
  rank: number;
  scopeType: string;
  status: string;
  isSystem: boolean;
  createdAt?: string;
}

export interface PermissionCatalogEntry {
  key: string;
  label: string;
  module: string;
  description?: string;
}

export interface ReportRecord {
  _id: string;
  type: ReportType;
  format: ExportFormat;
  title: string;
  filters: Record<string, unknown>;
  rowCount: number;
  district?: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  generatedBy?: MaybeRef;
  generatedByName?: string;
  createdAt: string;
}

export interface MemberStatusSummary {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  suspended: number;
}

export interface Breakdown {
  key: string;
  label: string;
  count: number;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number;
}

export interface DashboardData {
  members: MemberStatusSummary;
  totals: {
    units: number;
    communities: number;
    committees: number;
    events: number;
    upcomingEvents: number;
    announcements: number;
    documents: number;
    media: number;
    content?: number;
    contentPublished?: number;
    contentPending?: number;
    contentDraft?: number;
  };
  /**
   * `GET /reports/dashboard` groups every series under a single `charts`
   * object - they are NOT siblings of `totals` / `members`.
   */
  charts: {
    membersByUnit: Breakdown[];
    membersByCommunity: Breakdown[];
    monthlyGrowth: Array<{ month: string; count: number }>;
    attendanceTrend: Array<{
      month: string;
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }>;
    eventParticipation: Array<{ _id?: string; title: string; total: number; present: number }>;
    contentActivity: Array<{ month: string; count: number }>;
  };
  upcomingEvents: EventRecord[];
  todayAttendance: AttendanceSummary;
}

export interface AccountSummary {
  id: string;
  email: string;
  role: RoleName;
  status: AccountStatus;
  forcePasswordChange?: boolean;
}

export interface CreatedAccountResult {
  account: AccountSummary;
  temporaryPassword?: string;
}

export interface UserAccount extends Timestamps {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  role: RoleName;
  permissions: string[];
  member?: MaybeRef;
  district?: MaybeRef;
  unit?: MaybeRef;
  community?: MaybeRef;
  committee?: MaybeRef;
  status: AccountStatus;
  forcePasswordChange: boolean;
  lastLogin?: string;
  passwordChangedAt?: string;
  note?: string;
}

export interface SearchHit {
  entity: string;
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

export interface SearchGroup {
  entity: string;
  label: string;
  hits: SearchHit[];
}

export interface SearchResult {
  term: string;
  groups: SearchGroup[];
  total: number;
}


export interface MemberCommitteePosition {
  committee: MaybeRef;
  position: CommitteePosition;
  role?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
}

export interface Member extends Timestamps {
  memberId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  photo?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  address?: string;
  municipality?: string;
  ward?: string;
  emergencyContact?: string;
  joinedDate?: string;
  occupation?: string;
  education?: string;
  notes?: string;
  organization?: MaybeRef;
  district: MaybeRef;
  unit?: MaybeRef;
  communities?: MaybeRef[];
  committeePositions?: MemberCommitteePosition[];
  membershipType: MembershipType;
  status: MemberStatus;
  /** District review state (only set for unit/community level registrations). */
  registrationStatus?: RegistrationStatus;
  registrationRequestedBy?: MaybeRef;
  registrationRequestedAt?: string;
  registrationReviewedBy?: MaybeRef;
  registrationReviewedAt?: string;
  registrationReviewNote?: string;
  /** Enriched by the registration request list endpoint. */
  registrationRequestedByName?: string | null;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
