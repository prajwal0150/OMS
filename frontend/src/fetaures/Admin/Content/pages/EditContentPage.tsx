import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminFormPage, LoadingState } from '../../../../components';
import { useScopeOptions } from '../../../../hooks/useScopeOptions';
import { fetchContentById, updateContent } from '../services/contentService';
import {
  ContentFormFields,
  contentFormDefaults,
  contentFormSchema,
  slugify,
  toContentPayload,
  type ContentFormValues,
} from '../components/ContentFormFields';
import { resolveAssetUrl } from '../../../../services/api/httpClient';
import type { ContentRecord } from '../../../../types';

const toFormValues = (record: ContentRecord): ContentFormValues => ({
  ...contentFormDefaults,
  title: record.title ?? '',
  slug: record.slug ?? '',
  summary: record.summary ?? '',
  content: record.content ?? '',
  contentType: record.contentType ?? 'NEWS',

  unit: typeof record.unit === 'string' ? record.unit : (record.unit?._id ?? ''),
  community:
    typeof record.community === 'string' ? record.community : (record.community?._id ?? ''),
  visibility: record.visibility ?? 'UNIT',
  tags: (record.tags ?? []).join(', '),
});

/** Edit an existing content record. Scope fields are locked after creation. */
export function EditContentPage() {
  const { id = '' } = useParams();
  const { units, communities, loading: optionsLoading } = useScopeOptions();
  const [values, setValues] = useState<ContentFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<ContentRecord | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchContentById(id)
      .then((found) => {
        if (!active) return;
        setRecord(found);
        setValues(toFormValues(found));
      })
      .catch(() => {
        if (active) setError('That content could not be loaded, or is outside your scope.');
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (!id) return null;
  if (error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</div>
    );
  }
  if (!values) return <LoadingState label="Loading content..." />;

  const locked = record?.status === 'PUBLISHED' || record?.status === 'PENDING_REVIEW';

  return (
    <AdminFormPage<ContentFormValues>
      title="Edit content"
      description={`Currently ${(record?.status ?? 'draft').toLowerCase().replace(/_/g, ' ')}.`}
      backTo={`/admin/content/${id}`}
      breadcrumb={[{ label: 'Admin' }, { label: 'Content' }, { label: 'Edit' }]}
      schema={contentFormSchema}
      defaultValues={values}
      loading={optionsLoading}
      submitLabel="Save changes"
      toPayload={toContentPayload}
      asideTitle="Preview"
      aside={
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            {locked
              ? 'This content is locked while it is under review or published. Unpublish it first to make edits.'
              : 'You can preview how the content will look on the public site.'}
          </p>
          <a
            href={`/admin/content/${id}/preview`}
            className="inline-block text-sm text-primary hover:underline"
          >
            Open preview
          </a>
        </div>
      }
      onSubmit={async (payload) => {
        const saved = await updateContent(id, payload as never);
        setRecord(saved);
        return saved;
      }}
    >
      {({ register, errors, watch }) => {
        const title = watch('title');
        return (
          <div className="space-y-3">
            {record?.coverImage && (
              <img
                src={resolveAssetUrl(record.coverImage)}
                alt=""
                className="h-40 w-full rounded-lg border border-line object-cover"
              />
            )}
            {!record?.coverImage && title && (
              <p className="text-xs text-muted">Generated slug: {slugify(title)}</p>
            )}
            <ContentFormFields
              register={register}
              errors={errors}
              units={units}
              communities={communities}
              editing
            />
          </div>
        );
      }}
    </AdminFormPage>
  );
}

export default EditContentPage;
