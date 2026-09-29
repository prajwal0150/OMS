import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { Button, Input, Card } from '../../../../components/ui';
import { resetPassword, normalizeApiError } from '../../services/authService';
import { ORGANIZATION_NAME } from '../../../../constants';

const PASSWORD_RULE =
  'Use at least 8 characters with an uppercase letter, a lowercase letter and a number';

const schema = z
  .object({
    newPassword: z.string().min(8, PASSWORD_RULE),
    confirmPassword: z.string().min(8, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setStatus('saving');
    setMessage(null);
    try {
      await resetPassword({ token, newPassword: values.newPassword, confirmPassword: values.confirmPassword });
      setStatus('done');
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (error) {
      setStatus('error');
      setMessage(normalizeApiError(error).message);
    }
  };

  const invalidToken = !token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-secondary">{ORGANIZATION_NAME}</h1>
          <p className="text-sm text-muted">Choose a new password</p>
        </div>

        <Card>
          {status === 'done' ? (
            <div className="space-y-2 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" aria-hidden />
              <p className="text-sm text-slate-700">
                Your password has been reset. Redirecting you to sign in⬦
              </p>
            </div>
          ) : invalidToken ? (
            <div className="space-y-3 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-danger" aria-hidden />
              <p className="text-sm text-slate-700">This password reset link is not valid.</p>
              <Link to="/forgot-password">
                <Button variant="outline" className="w-full">
                  Request a new link
                </Button>
              </Link>
            </div>
          ) : (
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
                Update password
              </Button>
            </form>
          )}

          <div className="mt-3 border-t border-line pt-3 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
