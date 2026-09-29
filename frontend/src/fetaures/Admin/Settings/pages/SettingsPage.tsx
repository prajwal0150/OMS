import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Section,
  Toggle,
} from '../../../../components';
import { fetchSettings, updateSettings, type SettingsMap } from '../services/settingsService';
import { normalizeApiError } from '../../../../services/api/apiClient';
import { useAuthState } from '../../../Auth/hooks/useAuth';

interface Field {
  key: string;
  label: string;
  hint?: string;
  type: 'text' | 'email' | 'url' | 'number' | 'toggle';
  min?: number;
  max?: number;
}

const GROUPS: Array<{ title: string; description: string; fields: Field[] }> = [
  {
    title: 'Public site',
    description: 'Text shown in the footer, contact panel and SEO metadata.',
    fields: [
      { key: 'public.siteTitle', label: 'Site title', type: 'text' },
      { key: 'public.tagline', label: 'Tagline', type: 'text' },
      { key: 'public.contactEmail', label: 'Contact email', type: 'email' },
      { key: 'public.contactPhone', label: 'Contact phone', type: 'text' },
      { key: 'public.address', label: 'Address', type: 'text' },
      { key: 'public.facebookUrl', label: 'Facebook page URL', type: 'url' },
      { key: 'public.youtubeUrl', label: 'YouTube channel URL', type: 'url' },
    ],
  },
  {
    title: 'Contact form',
    description: 'Submissions from the public contact page are stored and appear in the admin inbox.',
    fields: [
      { key: 'contact.enabled', label: 'Accept contact form submissions', type: 'toggle' },
      { key: 'contact.notifyEmail', label: 'Send notification email to', type: 'email' },
      {
        key: 'contact.maxPerDay',
        label: 'Maximum submissions per IP per day',
        type: 'number',
        min: 1,
        max: 200,
      },
    ],
  },
  {
    title: 'Content review',
    description: 'Unit authored content is queued for district review before publication.',
    fields: [
      { key: 'content.requireReview', label: 'Require review before publishing', type: 'toggle' },
      {
        key: 'content.autoPublishPublic',
        label: 'Allow publishing straight to the public site',
        type: 'toggle',
      },
    ],
  },
  {
    title: 'File uploads',
    description: 'Limits applied to every upload across media, documents and content.',
    fields: [
      { key: 'upload.maxImageMb', label: 'Maximum image size (MB)', type: 'number', min: 1, max: 50 },
      {
        key: 'upload.maxDocumentMb',
        label: 'Maximum document size (MB)',
        type: 'number',
        min: 1,
        max: 200,
      },
      { key: 'upload.allowedImageTypes', label: 'Allowed image types', type: 'text' },
    ],
  },
  {
    title: 'Security',
    description: 'Session and password policy applied to every account.',
    fields: [
      {
        key: 'security.sessionTimeoutMinutes',
        label: 'Session timeout (minutes)',
        type: 'number',
        min: 5,
        max: 1440,
      },
      {
        key: 'security.forcePasswordChangeDays',
        label: 'Force password change after (days)',
        type: 'number',
        min: 0,
        max: 365,
      },
      {
        key: 'security.maxFailedLogins',
        label: 'Failed sign in attempts before lock',
        type: 'number',
        min: 3,
        max: 20,
      },
      {
        key: 'security.allowPasswordReset',
        label: 'Allow self service password reset',
        type: 'toggle',
      },
    ],
  },
  {
    title: 'Exports and reports',
    description: 'Defaults applied to the reports and export screens.',
    fields: [
      {
        key: 'report.defaultRowsPerPage',
        label: 'Rows per page',
        type: 'number',
        min: 10,
        max: 200,
      },
      { key: 'report.allowPdfExport', label: 'Allow PDF export', type: 'toggle' },
      { key: 'report.allowExcelExport', label: 'Allow Excel export', type: 'toggle' },
    ],
  },
];

/** Runtime configuration. Values live in MongoDB so no rebuild is required. */
export function SettingsPage() {
  const { can } = useAuthState();
  const [values, setValues] = useState<SettingsMap>({});
  const [original, setOriginal] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSettings()
      .then((result) => {
        if (!active) return;
        setValues(result);
        setOriginal(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(normalizeApiError(caught).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const result = await updateSettings(values);
      setValues(result);
      setOriginal(result);
      toast.success('Settings saved');
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading settings..." />;
  if (error) return <ErrorState message={error} />;

  const changed = Object.keys(values).some(
    (key) => String(values[key]) !== String(original[key]),
  );

  const setValue = (key: string, value: string | number | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Runtime configuration stored in MongoDB. Changes take effect without a redeploy."
        breadcrumb={[{ label: 'Admin' }, { label: 'Settings' }]}
        actions={
          can('settings.update') ? (
            <Button
              size="sm"
              onClick={() => void save()}
              loading={saving}
              disabled={!changed}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save settings
            </Button>
          ) : undefined
        }
      />

      {!can('settings.update') && (
        <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-slate-700">
          You have read only access to settings.
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {GROUPS.map((group) => (
          <Section key={group.title} title={group.title} description={group.description}>
            <Card>
              <div className="space-y-3">
                {group.fields.map((field) => {
                  const value = values[field.key];
                  if (field.type === 'toggle') {
                    return (
                      <Toggle
                        key={field.key}
                        label={field.label}
                        hint={field.hint}
                        checked={Boolean(value)}
                        disabled={!can('settings.update')}
                        onChange={(checked) => setValue(field.key, checked)}
                      />
                    );
                  }
                  return (
                    <Input
                      key={field.key}
                      label={field.label}
                      hint={field.hint}
                      type={field.type === 'number' ? 'number' : field.type}
                      min={field.min}
                      max={field.max}
                      disabled={!can('settings.update')}
                      value={value === undefined || value === null ? '' : String(value)}
                      onChange={(event) =>
                        setValue(
                          field.key,
                          field.type === 'number' ? Number(event.target.value) : event.target.value,
                        )
                      }
                    />
                  );
                })}
              </div>
            </Card>
          </Section>
        ))}
      </div>

      {can('settings.update') && (
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" onClick={() => void save()} loading={saving} disabled={!changed}>
            Save settings
          </Button>
          {changed && <span className="text-xs text-muted">You have unsaved changes</span>}
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
