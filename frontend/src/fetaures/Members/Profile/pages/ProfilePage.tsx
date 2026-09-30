import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Save } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DescriptionList,
  ErrorState,
  Input,
  LoadingState,
  Section,
  Textarea,
} from '../../../../components';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import { fetchMyProfile, updateMyProfile } from '../../services/memberPortalService';
import { usePortalData } from '../../hooks/usePortalData';
import { normalizeApiError } from '../../../../services/api/apiClient';
import { humanize, refName, type Member } from '../../../../types';

const schema = z.object({
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  municipality: z.string().trim().max(120).optional().or(z.literal('')),
  ward: z.string().trim().max(20).optional().or(z.literal('')),
  emergencyContact: z.string().trim().max(30).optional().or(z.literal('')),
  occupation: z.string().trim().max(120).optional().or(z.literal('')),
  education: z.string().trim().max(120).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

/**
 * Member profile. Members may maintain their own contact details only:
 * role, district, unit, committee position, membership type and account
 * status are administrator controlled and are shown read only.
 */
export function ProfilePage() {
  const { user } = useAuthState();
  const location = useLocation();
  const { data: member, loading, error, reload } = usePortalData<Member>(fetchMyProfile);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!member) return;
    reset({
      phone: member.phone ?? '',
      email: member.email ?? '',
      address: member.address ?? '',
      municipality: member.municipality ?? '',
      ward: member.ward ?? '',
      emergencyContact: member.emergencyContact ?? '',
      occupation: member.occupation ?? '',
      education: member.education ?? '',
    });
  }, [member, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await updateMyProfile(values);
      toast.success('Profile updated');
      reload();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading your profile..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!member) return <ErrorState message="Your member profile could not be loaded." />;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold text-secondary">My profile</h1>
        <p className="mt-0.5 text-sm text-muted">
          Keep your contact details up to date so your unit can reach you.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-semibold text-white">
            {member.firstName?.[0]}
            {member.lastName?.[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-secondary">
              {member.fullName ??
                [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ')}
            </p>
            <p className="truncate text-sm text-muted">{member.memberId}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
            <Link
              to="/change-password"
              state={{ from: location.pathname }}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-primary-soft/40 hover:text-primary"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden />
              Change password
            </Link>
            <Badge tone="primary">{humanize(member.membershipType)}</Badge>
            <Badge tone={member.status === 'ACTIVE' ? 'success' : 'warning'} dot>
              {humanize(member.status)}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Organization (read only)">
          <Card>
            <DescriptionList
              items={[
                { label: 'District', value: refName(member.district) },
                { label: 'Unit', value: refName(member.unit) ?? 'Not assigned' },
                {
                  label: 'Communities',
                  value:
                    (member.communities ?? [])
                      .map((community) => refName(community))
                      .filter(Boolean)
                      .join(', ') || 'None',
                },
                { label: 'Gender', value: member.gender ? humanize(member.gender) : '-' },
                { label: 'Account role', value: user?.role ?? '-' },
              ]}
            />
            <p className="mt-3 text-xs text-muted">
              Role, district, unit, committee position, membership type and account status can only
              be changed by an administrator.
            </p>
          </Card>
        </Section>

        <Section title="Contact details">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2" noValidate>
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input
                label="Municipality"
                error={errors.municipality?.message}
                {...register('municipality')}
              />
              <Input label="Ward" error={errors.ward?.message} {...register('ward')} />
              <Input
                label="Emergency contact"
                error={errors.emergencyContact?.message}
                {...register('emergencyContact')}
              />
              <Input
                label="Occupation"
                error={errors.occupation?.message}
                {...register('occupation')}
              />
              <Input
                label="Education"
                containerClassName="sm:col-span-2"
                error={errors.education?.message}
                {...register('education')}
              />
              <Textarea
                label="Address"
                containerClassName="sm:col-span-2"
                error={errors.address?.message}
                {...register('address')}
              />
              <div className="flex items-center gap-2 sm:col-span-2">
                <Button
                  type="submit"
                  size="sm"
                  loading={saving}
                  disabled={!isDirty}
                  leftIcon={<Save className="h-3.5 w-3.5" />}
                >
                  Save changes
                </Button>
                {isDirty && <span className="text-xs text-muted">You have unsaved changes</span>}
              </div>
            </form>
          </Card>
        </Section>
      </div>
    </div>
  );
}

export default ProfilePage;
