import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Button, Input, Card } from '../../../../components/ui';
import { requestPasswordReset, normalizeApiError } from '../../services/authService';
import { ORGANIZATION_NAME } from '../../../../constants';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email address').email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setStatus('sending');
    setMessage(null);
    setDevToken(null);
    try {
      const result = await requestPasswordReset(values);
      setStatus('sent');
      if (result.token) setDevToken(result.token);
    } catch (error) {
      setStatus('error');
      setMessage(normalizeApiError(error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-secondary">{ORGANIZATION_NAME}</h1>
          <p className="text-sm text-muted">Reset your password</p>
        </div>

        <Card>
          {status === 'sent' ? (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" aria-hidden />
              <p className="text-sm text-slate-700">
                If the email address belongs to an account, a password reset link has been sent.
              </p>
              {devToken && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-left">
                  <p className="text-xs font-medium text-amber-800">Development only</p>
                  <Link
                    to={`/reset-password/${devToken}`}
                    className="mt-1 block break-all text-xs text-primary hover:underline"
                  >
                    {devToken}
                  </Link>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatus('idle');
                  setDevToken(null);
                }}
              >
                Use a different email
              </Button>
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
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@organization.org"
                error={errors.email?.message}
                leftIcon={<Mail className="h-3.5 w-3.5" aria-hidden />}
                {...register('email')}
              />

              <Button type="submit" className="w-full" loading={status === 'sending'}>
                Send reset link
              </Button>
            </form>
          )}

          <div className="mt-3 border-t border-line pt-3 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden />
              Back to sign in
            </Link>
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-muted">
          Need help? Contact your district or unit administrator.
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
