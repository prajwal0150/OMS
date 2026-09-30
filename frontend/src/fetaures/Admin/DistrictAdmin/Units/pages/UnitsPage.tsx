import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ResourceListPage,
  Modal,
  ConfirmDialog,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  statusTone,
} from '../../../../../components';
import { useUnits } from '../hooks/useUnits';
import { fetchUnitList } from '../redux/unitThunk';
import { createUnit, deleteUnit, fetchDistricts, updateUnit } from '../services/unitService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import { RECORD_STATUS, humanize, refId, type OptionItem, type Unit } from '../../../../../types';

const STATUS_OPTIONS = Object.values(RECORD_STATUS).map((value) => ({
  value,
  label: humanize(value),
}));

interface FormState {
  name: string;
  code: string;
  district: string;
  location: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  description: string;
  status: string;
}

const EMPTY: FormState = {
  name: '',
  code: '',
  district: '',
  location: '',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  description: '',
  status: 'ACTIVE',
};

/** Optional text fields - sent only when filled in so blanks never wipe values. */
const OPTIONAL_FIELDS = [
  'description',
  'location',
  'address',
  'contactPerson',
  'phone',
  'email',
] as const;

/**
 * Unit administration. District administrators own the units of their own
 * district: they create, edit and delete them (the backend scopes every write
 * to the caller's district), while unit administrators keep view-only access.
 */
export function UnitsPage() {
  const { can, user } = useAuthState();
  const { items, pagination, loading, error, refresh } = useUnits();
  const [editing, setEditing] = useState<Unit | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [districts, setDistricts] = useState<OptionItem[]>([]);
  const [removing, setRemoving] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setForm(EMPTY);
    setOpen(true);
    loadDistrictOptions();
  };

  const openEdit = (unit: Unit) => {
    setEditing(unit);
    setForm({
      name: unit.name,
      code: unit.code,
      district: refId(unit.district) ?? '',
      location: unit.location ?? '',
      address: unit.address ?? '',
      contactPerson: unit.contactPerson ?? '',
      phone: unit.phone ?? '',
      email: unit.email ?? '',
      description: unit.description ?? '',
      status: unit.status,
    });
    setOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code) {
      toast.error('Name and code are required');
      return;
    }
    const payload: Record<string, unknown> = { name, code, status: form.status };
    for (const field of OPTIONAL_FIELDS) {
      const value = form[field].trim();
      if (value) payload[field] = value;
    }
    // The parent district is fixed once a unit exists, and district scoped
    // accounts never send one - the backend fills in their own district.
    if (!editing && form.district) payload.district = form.district;

    setSaving(true);
    try {
      if (editing) await updateUnit(editing._id, payload as Partial<Unit>);
      else await createUnit(payload as Partial<Unit>);
      toast.success(editing ? 'Unit updated' : 'Unit created');
      setOpen(false);
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setDeleting(true);
    try {
      await deleteUnit(removing._id);
      toast.success(`${removing.name} deleted`);
      setRemoving(null);
      refresh();
    } catch (caught) {
      // The backend refuses to delete a unit that still holds members.
      toast.error(normalizeApiError(caught).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ResourceListPage<Unit>
        title="Units"
        description="Operational units of the district."
        fetchList={fetchUnitList}
        items={items}
        pagination={pagination}
        loading={loading}
        error={error}
        rowKey={(row) => row._id}
        defaultSort="name"
        itemLabel="units"
        primaryAction={{ label: 'Add unit', hidden: !can('unit.create'), onClick: openCreate }}
        columns={[
          {
            key: 'name',
            header: 'Unit',
            sortable: true,
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{row.name}</p>
                <p className="text-xs text-muted">{row.code}</p>
              </div>
            ),
          },
          {
            key: 'location',
            header: 'Location',
            priority: false,
            sortable: true,
            render: (row) => row.location ?? '--',
          },
          {
            key: 'contact',
            header: 'Contact',
            priority: false,
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate text-slate-700">{row.contactPerson ?? '--'}</p>
                <p className="truncate text-xs text-muted">{row.phone ?? row.email ?? ''}</p>
              </div>
            ),
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
            render: (row) =>
              can('unit.update') || can('unit.delete') ? (
                <div className="flex justify-end gap-1">
                  {can('unit.update') ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </Button>
                  ) : null}
                  {can('unit.delete') ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => setRemoving(row)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              ) : null,
          },
        ]}
        filters={[{ name: 'status', label: 'Status', value: '', options: STATUS_OPTIONS }]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit unit' : 'Add unit'}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void save()} loading={saving}>
              {editing ? 'Save changes' : 'Create unit'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Code"
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
          {editing || user?.district || !districts.length ? null : (
            <Select
              label="District"
              value={form.district}
              options={[
                { value: '', label: 'Select a district' },
                ...districts.map((district) => ({ value: district._id, label: district.name })),
              ]}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          )}
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label="Contact person"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete unit"
        message={`Delete ${removing?.name ?? 'this unit'}? A unit that still has members assigned cannot be deleted.`}
        confirmLabel="Delete unit"
        destructive
        loading={deleting}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

export default UnitsPage;

