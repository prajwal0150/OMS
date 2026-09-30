import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Save, ShieldCheck } from 'lucide-react';
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
} from '../../../../../components';
import { fetchMyAdminProfile, updateMyAdminProfile } from '../services/profileService';
import type { AdminProfile } from '../types/profileTypes';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { humanize } from '../../../../../types';

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  middleName: z.string().trim().max(60).optional().or(z.literal('')),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /^[0-9+\-\s()]{7,20}$/.test(value), 'Enter a valid phone number'),
  profilePhoto: z.string().trim().max(400).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const initialsOf = (profile: AdminProfile): string =>
  `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || 'A';

/**
 * District Admin profile.
 *
 * Administrators may maintain their own contact details only. Role, account
 * status and organizational scope are administrator controlled and are rendered
 * read only, and the login email is fixed because it is the account identity.
 */
export function ProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setProfile(await fetchMyAdminProfile());
    } catch (caught) {
      setLoadError(normalizeApiError(caught).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!profile) return;
    reset({
      firstName: profile.firstName,
      middleName: profile.middleName,
      lastName: profile.lastName,
      phone: profile.phone,
      profilePhoto: profile.profilePhoto,
      note: profile.note,
    });
  }, [profile, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const updated = await updateMyAdminProfile(values);
      setProfile(updated);
      toast.success('Profile updated');
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading your profile..." />;
  if (loadError) return <ErrorState message={loadError} onRetry={() => void load()} />;
  if (!profile) return <ErrorState message="Your profile could not be loaded." />;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold text-secondary">My profile</h1>
        <p className="mt-0.5 text-sm text-muted">
          Your administrator account and the scope it is assigned to.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {initialsOf(profile)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-secondary">
              {[profile.firstName, profile.middleName, profile.lastName]
                .filter(Boolean)
                .join(' ')}
            </p>
            <p className="truncate text-xs text-muted">{profile.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/change-password"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden />
              Change password
            </Link>
            <Badge tone="primary">{profile.roleLabel}</Badge>
            <Badge tone={profile.status === 'ACTIVE' ? 'success' : 'warning'} dot>
              {humanize(profile.status)}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Assignment (read only)">
          <Card>
            <DescriptionList
              items={[
                { label: 'Role', value: profile.roleLabel },
                { label: 'Login email', value: profile.email },
                { label: 'District', value: profile.scope.district ?? 'Organization-wide' },
                { label: 'Unit', value: profile.scope.unit ?? 'Not assigned' },
                { label: 'Community', value: profile.scope.community ?? 'Not assigned' },
                { label: 'Committee', value: profile.scope.committee ?? 'Not assigned' },
                {
                  label: 'Last sign in',
                  value: profile.lastLogin
                    ? new Date(profile.lastLogin).toLocaleString()
                    : 'Never',
                },
              ]}
            />
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Role, account status and organizational scope are assigned by the Super Admin and
              cannot be changed here. Your login email is your account identity.
            </p>
          </Card>
        </Section>

        <Section title="Contact details">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2" noValidate>
              <Input
                label="First name"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Middle name"
                error={errors.middleName?.message}
                {...register('middleName')}
              />
              <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Input
                label="Photo URL"
                containerClassName="sm:col-span-2"
                error={errors.profilePhoto?.message}
                {...register('profilePhoto')}
              />
              <Textarea
                label="Note"
                containerClassName="sm:col-span-2"
                error={errors.note?.message}
                {...register('note')}
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