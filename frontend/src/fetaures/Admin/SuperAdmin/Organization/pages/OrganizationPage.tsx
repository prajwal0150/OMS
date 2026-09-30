import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Building2, Upload } from 'lucide-react';
import {
  AdminFormPage,
  DescriptionList,
  FileUploader,
  Input,
  Textarea,
} from '../../../../../components';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { loadOrganization, saveOrganization } from '../redux/organizationThunk';
import {
  selectOrganization,
  selectOrganizationError,
  selectOrganizationLoading,
} from '../redux/organizationSelector';
import { uploadOrganizationLogo } from '../services/organizationService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { resolveAssetUrl } from '../../../../../services/api/httpClient';
import { DEFAULT_COUNTRY, DEFAULT_PROVINCE } from '../../../../../constants';

const schema = z.object({
  name: z.string().trim().min(3, 'Enter the organization name').max(150),
  shortName: z.string().trim().max(60),
  description: z.string().trim().max(2000),
  province: z.string().trim().max(60),
  country: z.string().trim().max(60),
  address: z.string().trim().max(300),
  phone: z.string().trim().max(30),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  website: z.string().trim().url('Enter a valid URL').or(z.literal('')),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  name: '',
  shortName: '',
  description: '',
  province: DEFAULT_PROVINCE,
  country: DEFAULT_COUNTRY,
  address: '',
  phone: '',
  email: '',
  website: '',
  active: true,
};

/** Organization profile. Only `organization.update` can change these values. */
export function OrganizationPage() {
  const dispatch = useAppDispatch();
  const organization = useAppSelector(selectOrganization);
  const loading = useAppSelector(selectOrganizationLoading);
  const error = useAppSelector(selectOrganizationError);
  const [logo, setLogo] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  useEffect(() => {
    void dispatch(loadOrganization());
  }, [dispatch]);

  useEffect(() => {
    if (!organization) return;
    form.reset({
      name: organization.name,
      shortName: organization.shortName ?? '',
      description: organization.description ?? '',
      province: organization.province,
      country: organization.country,
      address: organization.address ?? '',
      phone: organization.phone ?? '',
      email: organization.email ?? '',
      website: organization.website ?? '',
      active: organization.active,
    });
  }, [organization, form]);

  if (error) return <p className="text-sm text-danger">{error}</p>;

  const uploadLogo = async () => {
    if (logo.length === 0) return;
    setUploading(true);
    try {
      await uploadOrganizationLogo(logo[0]);
      await dispatch(loadOrganization());
      setLogo([]);
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminFormPage<FormValues>
      title="Organization"
      description="The single organization profile shown on the public website and on every report header."
      breadcrumb={[{ label: 'Admin' }, { label: 'Organization' }]}
      schema={schema}
      defaultValues={DEFAULTS}
      loading={loading}
      submitLabel="Save changes"
      toPayload={(values) => values as unknown as Record<string, unknown>}
      onSubmit={async (payload) => {
        await dispatch(saveOrganization(payload as Partial<FormValues>)).unwrap();
        await uploadLogo();
      }}
      asideTitle="Branding"
      aside={
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-2 text-center">
            {organization?.logo ? (
              <img
                src={resolveAssetUrl(organization.logo)}
                alt="Organization logo"
                className="h-24 w-24 rounded-lg border border-line object-contain"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-line text-slate-300">
                <Building2 className="h-8 w-8" aria-hidden />
              </span>
            )}
            <FileUploader
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              maxSizeMb={5}
              label="Upload logo"
              hint="PNG, JPG, WEBP or SVG up to 5 MB"
              files={logo}
              onFilesChange={setLogo}
              uploading={uploading}
            />
          </div>
          <div className="border-t border-line pt-3">
            <DescriptionList
              items={[
                { label: 'Slug', value: organization?.slug },
                { label: 'Status', value: organization?.active ? 'Active' : 'Inactive' },
                {
                  label: 'Established',
                  value: organization?.establishedDate
                    ? new Date(organization.establishedDate).toLocaleDateString()
                    : null,
                },
              ]}
            />
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted">
            <Upload className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            Files are stored through the configured storage provider.
          </p>
        </div>
      }
    >
      {({ register, errors }) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Organization name"
            containerClassName="sm:col-span-2"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input label="Short name" error={errors.shortName?.message} {...register('shortName')} />
          <Input label="Province" error={errors.province?.message} {...register('province')} />
          <Input label="Country" error={errors.country?.message} {...register('country')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Website"
            containerClassName="sm:col-span-2"
            error={errors.website?.message}
            {...register('website')}
          />
          <Input
            label="Address"
            containerClassName="sm:col-span-2"
            error={errors.address?.message}
            {...register('address')}
          />
          <Textarea
            label="Description"
            containerClassName="sm:col-span-2"
            rows={4}
            error={errors.description?.message}
            {...register('description')}
          />
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-line accent-primary"
              {...register('active')}
            />
            <span className="text-sm text-slate-700">Organization is active</span>
          </label>
        </div>
      )}
    </AdminFormPage>
  );
}

export default OrganizationPage;
