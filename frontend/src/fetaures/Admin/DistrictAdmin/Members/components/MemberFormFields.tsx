import type { UseFormRegister } from 'react-hook-form';
import type { OptionItem } from '../../../../../types';
import { z } from 'zod';
import { Input, Select, Textarea } from '../../../../../components';
import { toFilterOptions } from '../../../../../hooks/useScopeOptions';
import { GENDER, MEMBERSHIP_TYPE, humanize, type Member } from '../../../../../types';

export const memberFormSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter the first name').max(60),
  middleName: z.string().trim().max(60),
  lastName: z.string().trim().min(1, 'Enter the last name').max(60),
  memberId: z.string().trim().max(30),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  phone: z.string().trim().min(7, 'Enter a contact number').max(20),
  dateOfBirth: z.string(),
  gender: z.string(),
  bloodGroup: z.string(),
  membershipType: z.string(),
  status: z.string(),
  unit: z.string(),
  community: z.string(),
  municipality: z.string().trim().max(120),
  ward: z.string().trim().max(20),
  address: z.string().trim().max(300),
  occupation: z.string().trim().max(120),
  education: z.string().trim().max(120),
  emergencyContact: z.string().trim().max(30),
  joinDate: z.string(),
  notes: z.string().trim().max(1000),
});

export type MemberFormValues = z.infer<typeof memberFormSchema>;

export const memberFormDefaults: MemberFormValues = {
  firstName: '',
  middleName: '',
  lastName: '',
  memberId: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'MALE',
  bloodGroup: '',
  membershipType: MEMBERSHIP_TYPE.REGULAR,
  status: 'PENDING',
  unit: '',
  community: '',
  municipality: '',
  ward: '',
  address: '',
  occupation: '',
  education: '',
  emergencyContact: '',
  joinDate: '',
  notes: '',
};

/** Empty strings become undefined so optional fields are never stored as "". */
export const toMemberPayload = (values: MemberFormValues) => {
  const { community, ...rest } = values;
  return {
    ...rest,
    dateOfBirth: values.dateOfBirth || undefined,
    joinDate: values.joinDate || undefined,
    email: values.email || undefined,
    middleName: values.middleName || undefined,
    bloodGroup: values.bloodGroup || undefined,
    unit: values.unit || undefined,
    // The API stores an array (`communities`); the form only offers one pick.
    communities: community ? [community] : [],
    notes: values.notes || undefined,
  };
};


/** Maps a stored member onto the form shape (dates become yyyy-mm-dd strings). */
const dateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');
const refId = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return '';
};

export const toMemberFormValues = (member: Member): MemberFormValues => ({
  ...memberFormDefaults,
  firstName: member.firstName ?? '',
  middleName: member.middleName ?? '',
  lastName: member.lastName ?? '',
  memberId: member.memberId ?? '',
  email: member.email ?? '',
  phone: member.phone ?? '',
  dateOfBirth: dateInput(member.dateOfBirth),
  gender: member.gender ?? memberFormDefaults.gender,
  bloodGroup: '',
  membershipType: member.membershipType ?? memberFormDefaults.membershipType,
  status: member.status ?? memberFormDefaults.status,
  unit: refId(member.unit),
  community: refId(member.communities?.[0]),
  municipality: member.municipality ?? '',
  ward: member.ward ?? '',
  address: member.address ?? '',
  occupation: member.occupation ?? '',
  education: member.education ?? '',
  emergencyContact: member.emergencyContact ?? '',
  joinDate: dateInput(member.joinedDate),
  notes: member.notes ?? '',
});

export interface MemberFormFieldsProps {
  /** The `register` function itself, so each field can spread its result. */
  register: UseFormRegister<MemberFormValues>;
  errors: Record<string, { message?: string } | undefined>;
  units: OptionItem[];
  communities: OptionItem[];
  /** Editing locks the identity fields that cannot change after creation. */
  editing?: boolean;
}

const optionList = (values: readonly string[]) =>
  values.map((value) => ({ value, label: humanize(value) }));

/** Shared member create/edit fields, identical on both screens. */
export function MemberFormFields({
  register,
  errors,
  units,
  communities,
  editing = false,
}: MemberFormFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="First name" required error={errors.firstName?.message} {...register('firstName')} />
      <Input label="Middle name" error={errors.middleName?.message} {...register('middleName')} />
      <Input label="Last name" required error={errors.lastName?.message} {...register('lastName')} />
      <Input
        label="Member ID"
        hint={editing ? 'The member ID cannot be changed' : 'Leave blank to generate one'}
        disabled={editing}
        error={errors.memberId?.message}
        {...register('memberId')}
      />
      <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
      <Input label="Phone" required error={errors.phone?.message} {...register('phone')} />
      <Input
        label="Date of birth"
        type="date"
        error={errors.dateOfBirth?.message}
        {...register('dateOfBirth')}
      />
      <Select
        label="Gender"
        options={optionList(Object.values(GENDER))}
        error={errors.gender?.message}
        {...register('gender')}
      />
      <Select
        label="Blood group"
        options={[{ value: '', label: 'Not recorded' }, ...optionList(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])]}
        error={errors.bloodGroup?.message}
        {...register('bloodGroup')}
      />
      <Select
        label="Membership type"
        options={optionList(Object.values(MEMBERSHIP_TYPE))}
        error={errors.membershipType?.message}
        {...register('membershipType')}
      />
      <Select
        label="Unit"
        required
        options={toFilterOptions(units)}
        placeholder="Select a unit"
        error={errors.unit?.message}
        {...register('unit')}
      />
      <Select
        label="Community"
        options={toFilterOptions(communities)}
        placeholder="Optional"
        error={errors.community?.message}
        {...register('community')}
      />
      <Select
        label="Status"
        options={optionList(['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXITED'])}
        error={errors.status?.message}
        {...register('status')}
      />
      <Input
        label="Join date"
        type="date"
        error={errors.joinDate?.message}
        {...register('joinDate')}
      />
      <Input
        label="Municipality"
        error={errors.municipality?.message}
        {...register('municipality')}
      />
      <Input label="Ward" error={errors.ward?.message} {...register('ward')} />
      <Input
        label="Occupation"
        error={errors.occupation?.message}
        {...register('occupation')}
      />
      <Input label="Education" error={errors.education?.message} {...register('education')} />
      <Input
        label="Emergency contact"
        containerClassName="sm:col-span-2"
        error={errors.emergencyContact?.message}
        {...register('emergencyContact')}
      />
      <Textarea
        label="Address"
        containerClassName="sm:col-span-2"
        error={errors.address?.message}
        {...register('address')}
      />
      <Textarea
        label="Internal notes"
        containerClassName="sm:col-span-2"
        hint="Visible to administrators only"
        rows={3}
        error={errors.notes?.message}
        {...register('notes')}
      />
    </div>
  );
}
