import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { Button, Input, Card } from '../../../../components/ui';
import { useAuthState } from '../../hooks/useAuth';
import { ORGANIZATION_NAME } from '../../../../constants';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, error, clearError } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    clearError();
    const ok = await login(values.email, values.password);
    setSubmitting(false);
    if (!ok) return;
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from ?? '/admin', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-secondary">{ORGANIZATION_NAME}</h1>
          <p className="text-sm text-muted">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@organization.org"
              error={errors.email?.message}
              leftIcon={<LogIn className="h-3.5 w-3.5" aria-hidden />}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="⬢⬢⬢⬢⬢⬢⬢⬢"
              error={errors.password?.message}
              leftIcon={<Lock className="h-3.5 w-3.5" aria-hidden />}
              {...register('password')}
            />

            <Button type="submit" className="w-full" loading={submitting}>
              Sign in
            </Button>
          </form>

          <div className="mt-3 border-t border-line pt-3 text-center">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-muted">
          Accounts are created by an administrator. There is no public registration.
        </p>
        <p className="mt-1 text-center text-xs">
          <Link to="/" className="text-muted hover:text-primary hover:underline">
            Back to public website
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
