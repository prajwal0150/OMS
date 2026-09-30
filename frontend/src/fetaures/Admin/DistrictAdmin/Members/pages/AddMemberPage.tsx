import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { AdminFormPage, Button, Input, Modal } from '../../../../../components';
import { useScopeOptions } from '../../../../../hooks/useScopeOptions';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { createMember, createMemberAccount } from '../services/memberService';
import {
  MemberFormFields,
  memberFormDefaults,
  memberFormSchema,
  toMemberPayload,
  type MemberFormValues,
} from '../components/MemberFormFields';

/** Member form plus the optional portal login block. */
const addMemberSchema = memberFormSchema
  .extend({
    createLogin: z.boolean(),
    loginEmail: z.string().trim().email('Enter a valid email address').or(z.literal('')),
    loginPassword: z.string().min(8, 'Use at least 8 characters').max(80).or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (!values.createLogin) return;
    if (!values.loginEmail && !values.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['loginEmail'],
        message: 'Enter the login email (or fill the member email field)',
      });
    }
  });

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

const addMemberDefaults: AddMemberFormValues = {
  ...memberFormDefaults,
  createLogin: false,
  loginEmail: '',
  loginPassword: '',
};

interface Credentials {
  memberId: string;
  email: string;
  password: string;
}

/**
 * Create a member. Unit and community are validated against the caller's scope.
 * Unit level accounts also trigger the district approval workflow: the member
 * stays pending (and any login stays blocked) until the district admin approves.
 */
export function AddMemberPage() {
  const navigate = useNavigate();
  const { can } = useAuthState();
  const { units, communities, loading: optionsLoading } = useScopeOptions();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const needsApproval = !can('member.register.approve');

  const closeCredentials = () => {
    const target = credentials?.memberId;
    setCredentials(null);
    if (target) navigate(`/admin/members/${target}`);
  };

  return (
    <>
      <AdminFormPage<AddMemberFormValues>
        title="Add member"
        description={
          needsApproval
            ? 'Register a community member. Your registration is sent to the district admin for approval.'
            : 'Register a new member. Optionally provision the portal login below.'
        }
        backTo="/admin/members"
        breadcrumb={[{ label: 'Admin' }, { label: 'Members' }, { label: 'Add' }]}
        schema={addMemberSchema}
        defaultValues={addMemberDefaults}
        loading={optionsLoading}
        submitLabel="Create member"
        toPayload={(values) => {
          const rest = { ...values } as Record<string, unknown>;
          delete rest.createLogin;
          delete rest.loginEmail;
          delete rest.loginPassword;
          return toMemberPayload(rest as unknown as MemberFormValues);
        }}
        onSubmit={async (payload, values) => {
          const member = await createMember(payload);
          const formValues = values as AddMemberFormValues;
          if (formValues.createLogin) {
            try {
              const result = await createMemberAccount(member._id, {
                email: formValues.loginEmail || formValues.email || undefined,
                password: formValues.loginPassword || undefined,
                phone: formValues.phone || undefined,
              });
              if (result.temporaryPassword && !formValues.loginPassword) {
                setCredentials({
                  memberId: member._id,
                  email: result.account.email,
                  password: result.temporaryPassword,
                });
                return member;
              }
            } catch (caught) {
              toast.error(
                `Member saved, but the login could not be created: ${normalizeApiError(caught).message}`,
              );
            }
          }
          navigate(`/admin/members/${member._id}`);
          return member;
        }}

        asideTitle="What happens next"
        aside={
          <ul className="space-y-2 text-sm text-slate-600">
            <li>1. A member ID is generated automatically if you leave it blank.</li>
            {needsApproval ? (
              <>
                <li>
                  2. The registration is sent to the <strong>district admin</strong> for approval.
                  The member stays <strong>Pending</strong> until it is approved.
                </li>
                <li>
                  3. A portal login created below only works after the district admin approves the
                  registration.
                </li>
              </>
            ) : (
              <>
                <li>
                  2. The member starts in <strong>Pending</strong> status until you activate the
                  record.
                </li>
                <li>
                  3. To give the member portal access, create the login below or open the record
                  later and use <strong>Create account</strong>.
                </li>
              </>
            )}
          </ul>
        }
      >
        {({ register, errors, watch }) => (
          <div className="space-y-3">
            <MemberFormFields
              register={register}
              errors={errors}
              units={units}
              communities={communities}
            />
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-sm font-semibold text-secondary">
                Member portal login (optional)
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  {...register('createLogin')}
                />
                Create the login now
              </label>
              {watch('createLogin') && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Login email"
                    type="email"
                    hint="Defaults to the member email above"
                    error={errors.loginEmail?.message}
                    {...register('loginEmail')}
                  />
                  <Input
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    hint="Leave blank to generate a temporary password"
                    error={errors.loginPassword?.message}
                    {...register('loginPassword')}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </AdminFormPage>

      {credentials && (
        <Modal
          open
          onClose={closeCredentials}
          title="Member login created"
          description="Share these credentials securely with the member."
          size="sm"
          footer={
            <Button size="sm" onClick={closeCredentials}>
              Done
            </Button>
          }
        >
          <div className="space-y-2 text-sm">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs text-muted">Email</p>
              <p className="font-medium text-slate-800">{credentials.email}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs text-muted">Temporary password</p>
              <p className="font-mono font-medium text-slate-800">{credentials.password}</p>
            </div>
            <p className="text-xs text-muted">
              {needsApproval
                ? 'The login stays blocked until the district admin approves the registration.'
                : 'The member must change this password on first sign in.'}
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}

export default AddMemberPage;

