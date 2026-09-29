import { z } from 'zod';
import {
  GENDER,
  MEMBERSHIP_TYPE,
  MEMBER_STATUS,
} from '../../constants/enums';
import {
  emailSchema,
  listOfObjectIds,
  objectIdOrName,
  objectIdSchema,
  optionalDateSchema,
  optionalString,
  paginationSchema,
  phoneSchema,
  requiredString,
} from '../../shared/validation';

export const memberListQuerySchema = paginationSchema.extend({
  unit: objectIdOrName().optional(),
  community: objectIdOrName().optional(),
  gender: z.enum(Object.values(GENDER) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(MEMBER_STATUS) as [string, ...string[]]).optional(),
  membershipType: z.enum(Object.values(MEMBERSHIP_TYPE) as [string, ...string[]]).optional(),
  joinedFrom: optionalString(40),
  joinedTo: optionalString(40),
});

const memberBaseSchema = z.object({
  firstName: requiredString(1, 60),
  middleName: optionalString(60),
  lastName: requiredString(1, 60),
  photo: optionalString(400),
  dateOfBirth: optionalDateSchema,
  gender: z.enum(Object.values(GENDER) as [string, ...string[]]).optional(),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  address: optionalString(300),
  municipality: optionalString(120),
  ward: optionalString(20),
  emergencyContact: optionalString(30),
  joinedDate: optionalDateSchema,
  occupation: optionalString(120),
  education: optionalString(120),
  notes: optionalString(1000),
  district: optionalString(40),
  unit: optionalString(40),
  communities: listOfObjectIds,
  membershipType: z.enum(Object.values(MEMBERSHIP_TYPE) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(MEMBER_STATUS) as [string, ...string[]]).optional(),
});

export const createMemberSchema = memberBaseSchema;

export const updateMemberSchema = memberBaseSchema.partial();

/** Members may only maintain their own personal details. */
export const updateOwnProfileSchema = z.object({
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  address: optionalString(300),
  municipality: optionalString(120),
  ward: optionalString(20),
  emergencyContact: optionalString(30),
  occupation: optionalString(120),
  education: optionalString(120),
  photo: optionalString(400),
});

export const createMemberAccountSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema,
  password: z.string().min(8).max(80).optional(),
  role: optionalString(40),
});

export const accountStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']),
});

export const memberIdParamsSchema = z.object({ id: objectIdSchema });
