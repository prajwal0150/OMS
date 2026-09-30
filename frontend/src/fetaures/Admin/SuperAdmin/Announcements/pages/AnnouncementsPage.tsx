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
} from '../../../../../components';
import { Badge, Toggle, statusTone } from '../../../../../components/ui';
import { format } from 'date-fns';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { fetchAnnouncementList } from '../redux/announcementThunk';
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from '../services/announcementService';
import { fetchDistricts } from '../../Organization/services/organizationService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import type { Announcement } from '../../../../../types';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../../hooks/useScopeOptions';
import {
  ENUM_LABELS,
  RECORD_STATUS,
  TARGET_TYPE,
  humanize,
  refId,
  type OptionItem,
} from '../../../../../types';

/** Member targeted notices are curated elsewhere, so only the scopes are offered. */
const AUDIENCES = [
  TARGET_TYPE.DISTRICT,
  TARGET_TYPE.UNIT,
  TARGET_TYPE.COMMUNITY,
  TARGET_TYPE.COMMITTEE,
];

const TARGET_OPTIONS = AUDIENCES.map((value) => ({
  value,
  label: ENUM_LABELS[value] ?? humanize(value),
}));

const STATUS_OPTIONS = Object.values(RECORD_STATUS).map((value) => ({
  value,
  label: humanize(value),
}));

/** Dates arrive as ISO strings but the date inputs want yyyy-mm-dd. */
const dateInput = (value?: string) => (value ? value.slice(0, 10) : '');

interface AnnouncementFormState {
  title: string;
  content: string;
  targetType: string;
  district: string;
  unit: string;
  community: string;
  committee: string;
  publishDate: string;
  expiryDate: string;
  status: string;
  isPublic: boolean;
}

const EMPTY: AnnouncementFormState = {
  title: '',
  content: '',
  targetType: TARGET_TYPE.DISTRICT,
  district: '',
  unit: '',
  community: '',
  committee: '',
  publishDate: '',
  expiryDate: '',
  status: RECORD_STATUS.ACTIVE,
  isPublic: true,
};

/**
 * Announcement administration. District administrators publish the notices of
 * their own district to the district, a unit, a community or a committee; the
 * backend scopes every write to the caller's district.
 */
export function AnnouncementsPage() {
  const { can, user } = useAuthState();
  const { items, pagination, loading, error, refresh } = useAnnouncements();
  const { units, communities, committees } = useScopeOptions();
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY);
  const [districts, setDistricts] = useState<OptionItem[]>([]);
  const [removing, setRemoving] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const committeeOptions = committees.map((committee) => ({
    value: committee._id,
    label: committee.name,
  }));

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

  const openEdit = (announcement: Announcement) => {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      targetType: announcement.targetType,
      district: refId(announcement.district) ?? '',
      unit: refId(announcement.unit) ?? '',
      community: refId(announcement.community) ?? '',
      committee: refId(announcement.committee) ?? '',
      publishDate: dateInput(announcement.publishDate),
      expiryDate: dateInput(announcement.expiryDate),
      status: announcement.status,
      isPublic: announcement.isPublic,
    });
    setOpen(true);
  };

  const save = async () => {
    const title = form.title.trim();
    if (title.length < 3) {
      toast.error('Enter a title of at least 3 characters');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Write the notice text');
      return;
    }
    if (form.targetType === TARGET_TYPE.UNIT && !form.unit) {
      toast.error('Select the unit this notice is addressed to');
      return;
    }
    if (form.targetType === TARGET_TYPE.COMMUNITY && !form.community) {
      toast.error('Select the community this notice is addressed to');
      return;
    }
    if (form.targetType === TARGET_TYPE.COMMITTEE && !form.committee) {
      toast.error('Select the committee this notice is addressed to');
      return;
    }

    const payload: Record<string, unknown> = {
      title,
      content: form.content.trim(),
      targetType: form.targetType,
      status: form.status,
      isPublic: form.isPublic,
    };
    if (form.publishDate) payload.publishDate = form.publishDate;
    if (form.expiryDate) payload.expiryDate = form.expiryDate;
    // A district wide notice never carries a unit, community or committee.
    if (form.targetType === TARGET_TYPE.UNIT) payload.unit = form.unit;
    if (form.targetType === TARGET_TYPE.COMMUNITY) payload.community = form.community;
    if (form.targetType === TARGET_TYPE.COMMITTEE) payload.committee = form.committee;
    // The parent district is fixed once a notice exists, and district scoped
    // accounts never send one - the backend fills in their own district.
    if (!editing && form.district) payload.district = form.district;

    setSaving(true);
    try {
      if (editing) await updateAnnouncement(editing._id, payload as Partial<Announcement>);
      else await createAnnouncement(payload as Partial<Announcement>);
      toast.success(editing ? 'Announcement updated' : 'Announcement published');
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
      await deleteAnnouncement(removing._id);
      toast.success('Announcement deleted');
      setRemoving(null);
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ResourceListPage<Announcement>
      title="Announcements"
      description="Notices targeted at the district, a unit, a community, a committee or selected members."
      fetchList={fetchAnnouncementList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="publishDate"
      itemLabel="announcements"
      columns={[
        {
          key: 'title',
          header: 'Announcement',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.title}</p>
              <p className="truncate text-xs text-muted">{row.content}</p>
            </div>
          ),
        },
        {
          key: 'targetType',
          header: 'Audience',
          sortable: true,
          render: (row) => <Badge tone="info">{humanize(row.targetType)}</Badge>,
        },
        {
          key: 'publishDate',
          header: 'Published',
          sortable: true,
          render: (row) => format(new Date(row.publishDate), 'MMM d, yyyy'),
        },
        {
          key: 'expiryDate',
          header: 'Expires',
          priority: false,
          render: (row) =>
            row.expiryDate ? format(new Date(row.expiryDate), 'MMM d, yyyy') : '—',
        },
        {
          key: 'isPublic',
          header: 'Public',
          priority: false,
          render: (row) =>
            row.isPublic ? <Badge tone="success">Public</Badge> : <Badge>Internal</Badge>,
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
            can('announcement.update') || can('announcement.delete') ? (
              <div className="flex justify-end gap-1">
                {can('announcement.update') ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => openEdit(row)}
                  >
                    Edit
                  </Button>
                ) : null}
                {can('announcement.delete') ? (
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
        label: 'Add announcement',
        hidden: !can('announcement.create'),
        onClick: openCreate,
      }}
      filters={[
        {
          name: 'targetType',
          label: 'TargetType',
          value: '',
          options: enumOptions(Object.values(TARGET_TYPE), ENUM_LABELS),
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
        title={editing ? 'Edit announcement' : 'Add announcement'}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void save()} loading={saving}>
              {editing ? 'Save changes' : 'Publish'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Title"
            required
            className="sm:col-span-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Notice"
              required
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <Select
            label="Audience"
            required
            value={form.targetType}
            options={TARGET_OPTIONS}
            onChange={(e) => setForm({ ...form, targetType: e.target.value })}
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
          {form.targetType === TARGET_TYPE.UNIT ? (
            <Select
              label="Unit"
              required
              value={form.unit}
              options={toFilterOptions(units)}
              placeholder="Select a unit"
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          ) : form.targetType === TARGET_TYPE.COMMUNITY ? (
            <Select
              label="Community"
              required
              value={form.community}
              options={toFilterOptions(communities)}
              placeholder="Select a community"
              onChange={(e) => setForm({ ...form, community: e.target.value })}
            />
          ) : form.targetType === TARGET_TYPE.COMMITTEE ? (
            <Select
              label="Committee"
              required
              value={form.committee}
              options={committeeOptions}
              placeholder="Select a committee"
              onChange={(e) => setForm({ ...form, committee: e.target.value })}
            />
          ) : null}
          <Input
            label="Publish date"
            type="date"
            hint="Leave blank to publish now"
            value={form.publishDate}
            onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
          />
          <Input
            label="Expiry date"
            type="date"
            hint="Leave blank for an open ended notice"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />
          <Toggle
            label="Public notice"
            hint="Public notices also appear on the website. Off means members only."
            checked={form.isPublic}
            onChange={(checked) => setForm({ ...form, isPublic: checked })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete announcement"
        message={`Delete "${removing?.title ?? 'this notice'}"? Everyone it was addressed to stops seeing it immediately.`}
        confirmLabel="Delete notice"
        destructive
        loading={deleting}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

export default AnnouncementsPage;
