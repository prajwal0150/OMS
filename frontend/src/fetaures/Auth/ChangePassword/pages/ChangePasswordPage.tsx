import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Button, Input, Card } from '../../../../components/ui';
import { useAuthState } from '../../hooks/useAuth';
import { ORGANIZATION_NAME } from '../../../../constants';

const PASSWORD_RULE =
  'Use at least 8 characters with an uppercase letter, a lowercase letter and a number';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, PASSWORD_RULE),
    confirmPassword: z.string().min(8, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'The new password must be different from the current one',
    path: ['newPassword'],
  });

type FormValues = z.infer<typeof schema>;

/**
 * Forced password change. Reached after the first sign-in of a newly created
 * Super Admin, administrator or member account.
 */
export function ChangePasswordPage() {
  const { changePassword, user } = useAuthState();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setStatus('saving');
    setMessage(null);
    const ok = await changePassword(values);
    if (ok) {
      navigate(user?.role === 'MEMBER' ? '/portal' : '/admin', { replace: true });
      return;
    }
    setStatus('error');
    setMessage('The password could not be changed. Please review the details and try again.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-secondary">{ORGANIZATION_NAME}</h1>
          <p className="text-sm text-muted">Set a new password to secure your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            {status === 'error' && message && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {message}
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              You must change your password before you can continue using the platform.
            </div>

            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              leftIcon={<KeyRound className="h-3.5 w-3.5" aria-hidden />}
              {...register('currentPassword')}
            />

            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              hint={PASSWORD_RULE}
              leftIcon={<Lock className="h-3.5 w-3.5" aria-hidden />}
              {...register('newPassword')}
            />

            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              leftIcon={<Lock className="h-3.5 w-3.5" aria-hidden />}
              {...register('confirmPassword')}
            />

            <Button type="submit" className="w-full" loading={status === 'saving'}>
              Save password &amp; continue
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
