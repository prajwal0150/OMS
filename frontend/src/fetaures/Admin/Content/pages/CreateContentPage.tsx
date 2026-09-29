import { useNavigate } from 'react-router-dom';
import { AdminFormPage } from '../../../../components';
import { useScopeOptions } from '../../../../hooks/useScopeOptions';
import { createContent } from '../services/contentService';
import {
  ContentFormFields,
  contentFormDefaults,
  contentFormSchema,
  toContentPayload,
  type ContentFormValues,
} from '../components/ContentFormFields';

/**
 * Author new content. New content always starts as a draft; publishing happens
 * through the review workflow so a unit can never publish straight to the
 * public site without district approval.
 */
export function CreateContentPage() {
  const navigate = useNavigate();
  const { units, communities, loading: optionsLoading } = useScopeOptions();

  return (
    <AdminFormPage<ContentFormValues>
      title="New content"
      description="Draft an article, story, announcement or awareness piece."
      backTo="/admin/content"
      breadcrumb={[{ label: 'Admin' }, { label: 'Content' }, { label: 'New' }]}
      schema={contentFormSchema}
      defaultValues={contentFormDefaults}
      loading={optionsLoading}
      submitLabel="Save draft"
      toPayload={toContentPayload}
      onSubmit={async (payload) => {
        const created = await createContent(payload as never);
        navigate(`/admin/content/${created._id}/edit`);
        return created;
      }}
      asideTitle="Publishing workflow"
      aside={
        <ol className="space-y-2 text-sm text-slate-600">
          <li>
            <strong>1. Draft</strong> - only you and reviewers can see it.
          </li>
          <li>
            <strong>2. Pending review</strong> - submit it when it is ready.
          </li>
          <li>
            <strong>3. Approved</strong> - a district administrator approves it.
          </li>
          <li>
            <strong>4. Published</strong> - it goes live on the public site.
          </li>
        </ol>
      }
    >
      {({ register, errors }) => (
        <ContentFormFields
          register={register}
          errors={errors}
          units={units}
          communities={communities}
        />
      )}
    </AdminFormPage>
  );
}

export default CreateContentPage;
