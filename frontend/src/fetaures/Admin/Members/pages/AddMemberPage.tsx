import { useNavigate } from 'react-router-dom';
import { AdminFormPage } from '../../../../components';
import { useScopeOptions } from '../../../../hooks/useScopeOptions';
import { createMember } from '../services/memberService';
import {
  MemberFormFields,
  memberFormDefaults,
  memberFormSchema,
  toMemberPayload,
  type MemberFormValues,
} from '../components/MemberFormFields';

/** Create a member. Unit and community are validated against the caller's scope. */
export function AddMemberPage() {
  const navigate = useNavigate();
  const { units, communities, loading: optionsLoading } = useScopeOptions();

  return (
    <AdminFormPage<MemberFormValues>
      title="Add member"
      description="Register a new member. The account is provisioned separately once the record is saved."
      backTo="/admin/members"
      breadcrumb={[{ label: 'Admin' }, { label: 'Members' }, { label: 'Add' }]}
      schema={memberFormSchema}
      defaultValues={memberFormDefaults}
      loading={optionsLoading}
      submitLabel="Create member"
      toPayload={toMemberPayload}
      onSubmit={async (payload) => {
        const member = await createMember(payload);
        navigate(`/admin/members/${member._id}`);
        return member;
      }}
      asideTitle="What happens next"
      aside={
        <ul className="space-y-2 text-sm text-slate-600">
          <li>1. A member ID is generated automatically if you leave it blank.</li>
          <li>
            2. The member starts in <strong>Pending</strong> status until you activate the record.
          </li>
          <li>
            3. To give the member portal access, open the record and use{' '}
            <strong>Create account</strong>.
          </li>
        </ul>
      }
    >
      {({ register, errors }) => (
        <MemberFormFields
          register={register}
          errors={errors}
          units={units}
          communities={communities}
        />
      )}
    </AdminFormPage>
  );
}

export default AddMemberPage;
