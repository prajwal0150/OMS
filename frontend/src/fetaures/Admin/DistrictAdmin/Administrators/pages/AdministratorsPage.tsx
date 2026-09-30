import { useState } from 'react';
import { KeyRound, Pencil, Power, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  ResourceListPage,
  Select,
  statusTone,
} from '../../../../../components';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../../hooks/useScopeOptions';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import { useAdministrators } from '../hooks/useAdministrators';
import { fetchAdministratorList } from '../redux/administratorThunk';
import {
  createAdministrator,
  deleteAdministrator,
  resetAdministratorPassword,
  setAdministratorStatus,
  updateAdministrator,
} from '../services/administratorService';
import { fetchDistricts } from '../../Shared/services/organizationService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import {
  ACCOUNT_STATUS,
  ENUM_LABELS,
  ROLE,
  ROLE_LABEL,
  humanize,
  refId,
  refName,
  type OptionItem,
  type RoleName,
  type UserAccount,
} from '../../../../../types';

const ADMIN_ROLES: RoleName[] = [
  ROLE.DISTRICT_ADMIN,
  ROLE.DISTRICT_COMMITTEE_MEMBER,
  ROLE.UNIT_ADMIN,
  ROLE.UNIT_COMMITTEE_MEMBER,
  ROLE.COMMUNITY_COORDINATOR,
  ROLE.COMMITTEE_MEMBER,
];

const ROLE_OPTIONS = ADMIN_ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }));

/** Unit and community level roles must also be pinned to a unit. */
const needsUnit = (role: string) =>
  role === ROLE.UNIT_ADMIN ||
  role === ROLE.UNIT_COMMITTEE_MEMBER ||
  role === ROLE.COMMUNITY_COORDINATOR ||
  role === ROLE.COMMITTEE_MEMBER;

interface AdminFormState {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  district: string;
  unit: string;
  community: string;
  password: string;
}

const EMPTY: AdminFormState = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  role: ROLE.DISTRICT_ADMIN,
  district: '',
  unit: '',
  community: '',
  password: '',
};

/**
 * A district administrator does not appoint peers, they appoint the
 * administrator of each of their units — so that is what the form starts on.
 * A Super Admin works across districts and keeps the district role as default.
 */
const defaultRoleFor = (districtScoped: boolean): string =>
  districtScoped ? ROLE.UNIT_ADMIN : ROLE.DISTRICT_ADMIN;

/**
 * Administrator accounts. Only an authorised administrator (normally the Super
 * Admin) may create them; the backend re-checks role and scope on every call.
 */
export function AdministratorsPage() {
  const { can, user } = useAuthState();
  const { items, pagination, loading, error, refresh } = useAdministrators();
  const { units, communities } = useScopeOptions();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AdminFormState>(EMPTY);
  const [created, setCreated] = useState<{ email: string; password?: string } | null>(null);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [districts, setDistricts] = useState<OptionItem[]>([]);
  const [removing, setRemoving] = useState<UserAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmRemove = async () => {
    if (!removing) return;
    setDeleting(true);
    try {
      await deleteAdministrator(removing._id);
      toast.success(`${removing.email} deleted`);
      setRemoving(null);
      refresh();
    } catch (caught) {
      // The backend refuses to delete an account that is still active.
      toast.error(normalizeApiError(caught).message);
    } finally {
      setDeleting(false);
    }
  };

  /** Super admins are not bound to one district, so the form needs a picker. */
  const loadDistrictOptions = () => {
    if (user?.district || districts.length > 0) return;
    fetchDistricts({ limit: 200 })
      .then((result) =>
        setDistricts(
          (result.items ?? []).map((district) => ({ _id: district._id, name: district.name })),
        ),
      )
      .catch(() => undefined);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, role: defaultRoleFor(Boolean(user?.district)) });
    setCreated(null);
    setOpen(true);
    loadDistrictOptions();
  };

  const openEdit = (account: UserAccount) => {
    setEditing(account);
    setCreated(null);
    setForm({
      firstName: account.firstName ?? '',
      middleName: account.middleName ?? '',
      lastName: account.lastName ?? '',
      email: account.email,
      phone: account.phone ?? '',
      role: account.role,
      district: refId(account.district) ?? '',
      unit: refId(account.unit) ?? '',
      community: refId(account.community) ?? '',
      password: '',
    });
    setOpen(true);
    loadDistrictOptions();
  };

  const submit = async () => {
    // The unit (or community) is what gives the account its authority, so it is
    // checked before the round trip instead of coming back as a 400.
    if (form.role === ROLE.COMMUNITY_COORDINATOR && !form.community) {
      toast.error('Select the community this administrator coordinates');
      return;
    }
    if (needsUnit(form.role) && !form.unit && form.role !== ROLE.COMMUNITY_COORDINATOR) {
      toast.error('Select the unit this administrator is assigned to');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        // A password is never edited here — the reset action issues a new one.
        await updateAdministrator(editing._id, {
          firstName: form.firstName,
          middleName: form.middleName || undefined,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role as RoleName,
          district: form.district || undefined,
          unit: form.unit || undefined,
          community: form.community || undefined,
        });
        toast.success('Administrator account updated');
        setOpen(false);
        refresh();
        return;
      }
      const result = await createAdministrator({
        firstName: form.firstName,
        middleName: form.middleName || undefined,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role as RoleName,
        password: form.password || undefined,
        district: form.district || undefined,
        unit: form.unit || undefined,
        community: form.community || undefined,
      });
      setCreated({ email: result.account.email, password: result.temporaryPassword });
      toast.success('Administrator account created');
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (account: UserAccount, status: string) => {
    try {
      await setAdministratorStatus(account._id, status);
      toast.success(`Account set to ${humanize(status)}`);
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    }
  };

  const resetPassword = async (account: UserAccount) => {
    try {
      const result = await resetAdministratorPassword(account._id);
      setCreated({ email: account.email, password: result.temporaryPassword });
      setOpen(true);
      toast.success('Temporary password generated');
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    }
  };

  return (
    <>
      <ResourceListPage<UserAccount>
        title="Administrators"
        description={
          user?.district
            ? 'Appoint and manage the administrator of every unit, community and committee of your district.'
            : 'District, unit, community and committee accounts across the organization.'
        }
        fetchList={fetchAdministratorList}
        items={items}
        pagination={pagination}
        loading={loading}
        error={error}
        rowKey={(row) => row._id}
        itemLabel="administrators"
        primaryAction={{
          label: 'Add administrator',
          hidden: !can('admin.account.create'),
          onClick: openCreate,
        }}
        columns={[
          {
            key: 'name',
            header: 'Administrator',
            sortable: true,
            render: (row) => (
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                  {row.firstName?.[0]}
                  {row.lastName?.[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    {[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ')}
                  </p>
                  <p className="truncate text-xs text-muted">{row.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            sortable: true,
            render: (row) => (
              <Badge tone="primary">{row.role ? ROLE_LABEL[row.role] ?? row.role : 'Unknown'}</Badge>
            ),
          },
          {
            key: 'district',
            header: 'District',
            priority: false,
            render: (row) => refName(row.district) ?? '--',
          },
          {
            key: 'unit',
            header: 'Unit',
            priority: false,
            render: (row) => refName(row.unit) ?? 'District-wide',
          },
          {
            key: 'community',
            header: 'Community',
            priority: false,
            render: (row) => refName(row.community) ?? '--',
          },
          {
            key: 'lastLogin',
            header: 'Last sign in',
            priority: false,
            sortable: true,
            render: (row) => (row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never'),
          },
          {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (row) => (
              <Badge tone={statusTone(row.status)} dot>
                {humanize(row.status)}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row) => {
              const isSelf = row._id === user?._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  {can('admin.account.update') && !isSelf && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Edit administrator"
                      title="Edit administrator"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                  {can('admin.account.resetPassword') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Reset password"
                      title="Reset password"
                      onClick={() => void resetPassword(row)}
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                  {can('admin.account.activate') && !isSelf && row.status !== 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Activate account"
                      title="Activate account"
                      onClick={() => void setStatus(row, 'ACTIVE')}
                    >
                      <Power className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                  {can('admin.account.deactivate') && !isSelf && row.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      onClick={() => void setStatus(row, 'INACTIVE')}
                    >
                      Deactivate
                    </Button>
                  )}
                  {can('admin.account.delete') && !isSelf && row.status !== 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      className="text-danger"
                      onClick={() => setRemoving(row)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]}
        filters={[
          { name: 'role', label: 'Role', value: '', options: ROLE_OPTIONS },
          {
            name: 'status',
            label: 'Status',
            value: '',
            options: enumOptions(Object.values(ACCOUNT_STATUS), ENUM_LABELS),
          },
          { name: 'unit', label: 'Unit', value: '', options: toFilterOptions(units) },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={created ? 'Account credentials' : editing ? 'Edit administrator' : 'Add administrator'}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
            {!created && (
              <Button size="sm" onClick={() => void submit()} loading={saving}>
                {editing ? 'Save changes' : 'Create account'}
              </Button>
            )}
          </>
        }
      >
        {created ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Share these credentials securely. The temporary password is shown only once and
              the account must change it on first sign in.
            </p>
            <div className="rounded-lg border border-line bg-slate-50 p-3">
              <p className="text-xs text-muted">Email</p>
              <p className="text-sm font-medium text-secondary">{created.email}</p>
              {created.password && (
                <>
                  <p className="mt-2 text-xs text-muted">Temporary password</p>
                  <p className="font-mono text-sm font-medium text-secondary">{created.password}</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="First name"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <Input
                label="Middle name"
                value={form.middleName}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
              />
            </div>
            <Input
              label="Last name"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <Select
              label="Role"
              required
              value={form.role}
              options={ROLE_OPTIONS}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            {user?.district || !districts.length ? (
              <Input
                label="District"
                hint={
                  user?.district
                    ? 'Fixed to your own district'
                    : 'Required for every administrator except the Super Admin'
                }
                value={form.district || user?.district || ''}
                disabled
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            ) : (
              <Select
                label="District"
                required
                value={form.district}
                options={districts.map((district) => ({ value: district._id, label: district.name }))}
                placeholder="Select a district"
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            )}
            {needsUnit(form.role) && (
              <Select
                label="Unit"
                required
                value={form.unit}
                options={toFilterOptions(units)}
                placeholder="Select a unit"
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            )}
            {(form.role === ROLE.COMMUNITY_COORDINATOR || form.role === ROLE.COMMITTEE_MEMBER) && (
              <Select
                label="Community"
                value={form.community}
                options={toFilterOptions(communities)}
                placeholder="Select a community"
                onChange={(e) => setForm({ ...form, community: e.target.value })}
              />
            )}
            {editing ? null : (
              <Input
                label="Temporary password"
                type="password"
                hint="Leave blank to generate one automatically"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete administrator"
        message={`Delete ${removing?.email ?? 'this account'}? The account must already be deactivated, and the sign in will be revoked for good.`}
        confirmLabel="Delete account"
        destructive
        loading={deleting}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

export default AdministratorsPage;
