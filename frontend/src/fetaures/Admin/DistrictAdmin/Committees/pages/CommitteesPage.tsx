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
import { useCommittees } from '../hooks/useCommittees';
import { fetchCommitteeList } from '../redux/committeeThunk';
import { createCommittee, deleteCommittee, updateCommittee } from '../services/committeeService';
import { fetchDistricts } from '../../Shared/services/organizationService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../../hooks/useScopeOptions';
import {
  COMMITTEE_LEVEL,
  ENUM_LABELS,
  RECORD_STATUS,
  humanize,
  refId,
  refName,
  type Committee,
  type OptionItem,
} from '../../../../../types';

const LEVEL_OPTIONS = Object.values(COMMITTEE_LEVEL).map((value) => ({
  value,
  label: ENUM_LABELS[value] ?? humanize(value),
}));

const STATUS_OPTIONS = Object.values(RECORD_STATUS).map((value) => ({
  value,
  label: humanize(value),
}));

interface FormState {
  name: string;
  level: string;
  district: string;
  unit: string;
  community: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
}

const EMPTY: FormState = {
  name: '',
  level: COMMITTEE_LEVEL.DISTRICT,
  district: '',
  unit: '',
  community: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  description: '',
};

/** Dates arrive as ISO strings but the date inputs want yyyy-mm-dd. */
const dateInput = (value?: string) => (value ? value.slice(0, 10) : '');

/**
 * Committee administration. District administrators own the committees of
 * their own district at every level (district, unit and community): they
 * create, edit and delete them, while the backend scopes every write to the
 * caller's district. Read-only roles keep the list without the row actions.
 */
export function CommitteesPage() {
  const { can, user } = useAuthState();
  const { items, pagination, loading, error, refresh } = useCommittees();
  const { units, communities } = useScopeOptions();
  const [editing, setEditing] = useState<Committee | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [districts, setDistricts] = useState<OptionItem[]>([]);
  const [removing, setRemoving] = useState<Committee | null>(null);
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

  const openEdit = (committee: Committee) => {
    setEditing(committee);
    setForm({
      name: committee.name,
      level: committee.level,
      district: refId(committee.district) ?? '',
      unit: refId(committee.unit) ?? '',
      community: refId(committee.community) ?? '',
      startDate: dateInput(committee.startDate),
      endDate: dateInput(committee.endDate),
      status: committee.status,
      description: committee.description ?? '',
    });
    setOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (name.length < 3) {
      toast.error('Enter a committee name of at least 3 characters');
      return;
    }
    const level = form.level;
    const unit = form.unit.trim();
    const community = form.community.trim();
    if (level === COMMITTEE_LEVEL.UNIT && !unit) {
      toast.error('Select the unit this committee belongs to');
      return;
    }
    if (level === COMMITTEE_LEVEL.COMMUNITY && !community) {
      toast.error('Select the community this committee belongs to');
      return;
    }

    const payload: Record<string, unknown> = { name, level, status: form.status };
    const description = form.description.trim();
    if (description) payload.description = description;
    if (form.startDate) payload.startDate = form.startDate;
    if (form.endDate) payload.endDate = form.endDate;
    // A district level committee never carries a unit or community reference.
    if (level !== COMMITTEE_LEVEL.DISTRICT && unit) payload.unit = unit;
    if (level === COMMITTEE_LEVEL.COMMUNITY && community) payload.community = community;
    // The parent district is fixed once a committee exists, and district scoped
    // accounts never send one - the backend fills in their own district.
    if (!editing && form.district) payload.district = form.district;

    setSaving(true);
    try {
      if (editing) await updateCommittee(editing._id, payload as Partial<Committee>);
      else await createCommittee(payload as Partial<Committee>);
      toast.success(editing ? 'Committee updated' : 'Committee created');
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
      await deleteCommittee(removing._id);
      toast.success(`${removing.name} deleted`);
      setRemoving(null);
      refresh();
    } catch (caught) {
      // The backend refuses to delete a committee that still holds members.
      toast.error(normalizeApiError(caught).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ResourceListPage<Committee>
      title="Committees"
      description="District, unit and community committees and their positions."
      fetchList={fetchCommitteeList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="name"
      itemLabel="committees"
      columns={[
        {
          key: 'name',
          header: 'Committee',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.name}</p>
              <p className="truncate text-xs text-muted">{row.description ?? ''}</p>
            </div>
          ),
        },
        {
          key: 'level',
          header: 'Level',
          sortable: true,
          render: (row) => <Badge tone="primary">{humanize(row.level)}</Badge>,
        },
        {
          key: 'scope',
          header: 'Scope',
          priority: false,
          render: (row) =>
            [refName(row.unit), refName(row.community)].filter(Boolean).join(' / ') || 'District',
        },
        {
          key: 'positions',
          header: 'Positions',
          align: 'center',
          render: (row) => (
            <span className="text-sm text-slate-700">{(row.positions ?? []).length}</span>
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
            can('committee.update') || can('committee.delete') ? (
              <div className="flex justify-end gap-1">
                {can('committee.update') ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => openEdit(row)}
                  >
                    Edit
                  </Button>
                ) : null}
                {can('committee.delete') ? (
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
      primaryAction={{
        label: 'Add committee',
        hidden: !can('committee.create'),
        onClick: openCreate,
      }}
      filters={[
        {
          name: 'level',
          label: 'Level',
          value: '',
          options: enumOptions(Object.values(COMMITTEE_LEVEL), ENUM_LABELS),
        },
        {
          name: 'status',
          label: 'Status',
          value: '',
          options: enumOptions(Object.values(RECORD_STATUS), ENUM_LABELS),
        },
        {
          name: 'unit',
          label: 'Unit',
          value: '',
          options: toFilterOptions(units),
        },
        {
          name: 'community',
          label: 'Community',
          value: '',
          options: toFilterOptions(communities),
        },
      ]}
      
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit committee' : 'Add committee'}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void save()} loading={saving}>
              {editing ? 'Save changes' : 'Create committee'}
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
          <Select
            label="Level"
            required
            value={form.level}
            options={LEVEL_OPTIONS}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
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
          {form.level === COMMITTEE_LEVEL.DISTRICT ? null : (
            <Select
              label={form.level === COMMITTEE_LEVEL.COMMUNITY ? 'Unit (optional)' : 'Unit'}
              required={form.level === COMMITTEE_LEVEL.UNIT}
              value={form.unit}
              options={toFilterOptions(units)}
              placeholder="Select a unit"
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          )}
          {form.level === COMMITTEE_LEVEL.COMMUNITY ? (
            <Select
              label="Community"
              required
              value={form.community}
              options={toFilterOptions(communities)}
              placeholder="Select a community"
              onChange={(e) => setForm({ ...form, community: e.target.value })}
            />
          ) : null}
          <Input
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
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
        title="Delete committee"
        message={`Delete ${removing?.name ?? 'this committee'}? A committee that still has members in its positions cannot be deleted.`}
        confirmLabel="Delete committee"
        destructive
        loading={deleting}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

export default CommitteesPage;
