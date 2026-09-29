import { useState, type ReactNode } from 'react';
import { useForm, type DefaultValues, type FieldValues, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, ErrorState, LoadingState, PageHeader } from './ui';
import { normalizeApiError } from '../services/api/apiClient';

export interface AdminFormPageProps<TValues extends FieldValues> {
  title: string;
  description?: string;
  backTo?: string;
  breadcrumb?: Array<{ label: string }>;
  schema: z.ZodType<TValues>;
  defaultValues: DefaultValues<TValues>;
  /** Maps the form values onto the API payload. */
  toPayload?: (values: TValues) => Record<string, unknown>;
  submitLabel?: string;
  /** Async submit handler; thrown errors are surfaced as a toast. */
  onSubmit: (payload: Record<string, unknown>, values: TValues) => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  children: (form: {
    register: ReturnType<typeof useForm<TValues>>['register'];
    control: ReturnType<typeof useForm<TValues>>['control'];
    errors: Record<string, { message?: string } | undefined>;
    isDirty: boolean;
    setValue: ReturnType<typeof useForm<TValues>>['setValue'];
    watch: ReturnType<typeof useForm<TValues>>['watch'];
  }) => ReactNode;
  /** Rendered under the form (details, danger zone, hints). */
  aside?: ReactNode;
  asideTitle?: string;
  loading?: boolean;
}

/**
 * Shared shell for every admin create/edit screen: react-hook-form + zod,
 * compact rounded-lg layout, consistent save/cancel behaviour and a single
 * place where backend errors become user-readable toasts.
 */
export function AdminFormPage<TValues extends FieldValues>({
  title,
  description,
  backTo,
  breadcrumb,
  schema,
  defaultValues,
  toPayload,
  submitLabel = 'Save',
  onSubmit,
  onSuccess,
  children,
  aside,
  asideTitle,
  loading = false,
}: AdminFormPageProps<TValues>) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit: SubmitHandler<TValues> = async (values) => {
    setSaving(true);
    try {
      const payload = toPayload ? toPayload(values) : (values as unknown as Record<string, unknown>);
      const result = await onSubmit(payload, values);
      toast.success(`${title.replace(/s$/, '')} saved`);
      onSuccess?.(result);
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading..." />;

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        breadcrumb={breadcrumb}
        actions={
          backTo ? (
            <Link to={backTo}>
              <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
                Back
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3" noValidate>
            {children({
              register: form.register,
              control: form.control,
              errors: form.formState.errors as Record<string, { message?: string } | undefined>,
              isDirty: form.formState.isDirty,
              setValue: form.setValue,
              watch: form.watch,
            })}

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <Button
                type="submit"
                size="sm"
                loading={saving}
                leftIcon={<Save className="h-3.5 w-3.5" />}
              >
                {submitLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate(backTo ?? '/admin')}
              >
                Cancel
              </Button>
              {form.formState.isDirty && (
                <span className="text-xs text-muted">You have unsaved changes</span>
              )}
            </div>
          </form>
        </Card>

        {aside && (
          <Card>
            {asideTitle && (
              <p className="mb-2 text-sm font-semibold text-secondary">{asideTitle}</p>
            )}
            {aside}
          </Card>
        )}
      </div>
    </div>
  );
}

export { ErrorState };
export default AdminFormPage;
