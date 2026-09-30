import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminFormPage, LoadingState } from '../../../../../components';
import { useScopeOptions } from '../../../../../hooks/useScopeOptions';
import { fetchMemberById, updateMember } from '../services/memberService';
import {
  MemberFormFields,
  memberFormDefaults,
  memberFormSchema,
  toMemberFormValues,
  toMemberPayload,
  type MemberFormValues,
} from '../components/MemberFormFields';
import type { Member } from '../../../../../types';

/** Edit a member. Identity fields that cannot change are locked on the form. */
export function EditMemberPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { units, communities, loading: optionsLoading } = useScopeOptions();
  const [values, setValues] = useState<MemberFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchMemberById(id)
      .then((record: Member) => {
        if (active) setValues(toMemberFormValues(record));
      })
      .catch(() => {
        if (active) setError('That member could not be loaded, or is outside your scope.');
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
  if (!values) return <LoadingState label="Loading member..." />;

  return (
    <AdminFormPage<MemberFormValues>
      title="Edit member"
      description="Update a member's details. Every change is recorded in the audit log."
      backTo={`/admin/members/${id}`}
      breadcrumb={[{ label: 'Admin' }, { label: 'Members' }, { label: 'Edit' }]}
      schema={memberFormSchema}
      defaultValues={values}
      loading={optionsLoading}
      submitLabel="Save changes"
      toPayload={toMemberPayload}
      onSubmit={async (payload) => {
        const saved = await updateMember(id, payload as never);
        navigate(`/admin/members/${id}`);
        return saved;
      }}
    >
      {({ register, errors }) => (
        <MemberFormFields
          register={register}
          errors={errors}
          units={units}
          communities={communities}
          editing
        />
      )}
    </AdminFormPage>
  );
}

export default EditMemberPage;
export { memberFormDefaults };
