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
import { Badge, statusTone } from '../../../../../components/ui';
import { format } from 'date-fns';
import { useEvents } from '../hooks/useEvents';
import { fetchEventList } from '../redux/eventThunk';
import { createEvent, deleteEvent, updateEvent } from '../services/eventService';
import { fetchDistricts } from '../../Organization/services/organizationService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import type { EventRecord } from '../../../../../types';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../../hooks/useScopeOptions';
import {
  ENUM_LABELS,
  EVENT_LEVEL,
  EVENT_STATUS,
  EVENT_TYPE,
  humanize,
  refId,
  refName,
  type OptionItem,
} from '../../../../../types';

const TYPE_OPTIONS = Object.values(EVENT_TYPE).map((value) => ({
  value,
  label: ENUM_LABELS[value] ?? humanize(value),
}));

const LEVEL_OPTIONS = Object.values(EVENT_LEVEL).map((value) => ({
  value,
  label: ENUM_LABELS[value] ?? humanize(value),
}));

const STATUS_OPTIONS = Object.values(EVENT_STATUS).map((value) => ({
  value,
  label: humanize(value),
}));

/** Dates arrive as ISO strings but the date inputs want yyyy-mm-dd. */
const dateInput = (value?: string) => (value ? value.slice(0, 10) : '');

interface EventFormState {
  title: string;
  type: string;
  level: string;
  organizer: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  capacity: string;
  status: string;
  district: string;
  unit: string;
  community: string;
  committee: string;
  description: string;
}

const EMPTY: EventFormState = {
  title: '',
  type: EVENT_TYPE.MEETING,
  level: EVENT_LEVEL.DISTRICT,
  organizer: '',
  location: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  capacity: '',
  status: EVENT_STATUS.SCHEDULED,
  district: '',
  unit: '',
  community: '',
  committee: '',
  description: '',
};

/**
 * Event administration. District administrators own the events of their own
 * district at every level; the backend scopes each write to the caller's
 * district, so a district scoped account never sends a district id.
 */
export function EventsPage() {
  const { can, user } = useAuthState();
  const { items, pagination, loading, error, refresh } = useEvents();
  const { units, communities, committees } = useScopeOptions();
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventFormState>(EMPTY);
  const [districts, setDistricts] = useState<OptionItem[]>([]);
  const [removing, setRemoving] = useState<EventRecord | null>(null);
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

  const openEdit = (event: EventRecord) => {
    setEditing(event);
    setForm({
      title: event.title,
      type: event.type,
      level: event.level,
      organizer: event.organizer ?? '',
      location: event.location ?? '',
      startDate: dateInput(event.startDate),
      startTime: event.startTime ?? '',
      endDate: dateInput(event.endDate),
      endTime: event.endTime ?? '',
      capacity: event.capacity === undefined ? '' : String(event.capacity),
      status: event.status,
      district: refId(event.district) ?? '',
      unit: refId(event.unit) ?? '',
      community: refId(event.community) ?? '',
      committee: refId(event.committee) ?? '',
      description: event.description ?? '',
    });
    setOpen(true);
  };

  const save = async () => {
    const title = form.title.trim();
    if (title.length < 3) {
      toast.error('Enter an event title of at least 3 characters');
      return;
    }
    if (!form.startDate) {
      toast.error('Select the date the event starts');
      return;
    }
    if (form.level === EVENT_LEVEL.UNIT && !form.unit) {
      toast.error('Select the unit this event belongs to');
      return;
    }
    if (form.level === EVENT_LEVEL.COMMUNITY && !form.community) {
      toast.error('Select the community this event belongs to');
      return;
    }
    if (form.level === EVENT_LEVEL.COMMITTEE && !form.committee) {
      toast.error('Select the committee this event belongs to');
      return;
    }

    const payload: Record<string, unknown> = {
      title,
      type: form.type,
      level: form.level,
      status: form.status,
      startDate: form.startDate,
    };
    if (form.organizer.trim()) payload.organizer = form.organizer.trim();
    if (form.location.trim()) payload.location = form.location.trim();
    if (form.startTime) payload.startTime = form.startTime;
    if (form.endTime) payload.endTime = form.endTime;
    if (form.endDate) payload.endDate = form.endDate;
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.capacity.trim()) payload.capacity = Number(form.capacity);
    // A district level event never carries a unit, community or committee.
    if (form.level !== EVENT_LEVEL.DISTRICT && form.unit) payload.unit = form.unit;
    if (form.level === EVENT_LEVEL.COMMUNITY && form.community) payload.community = form.community;
    if (form.level === EVENT_LEVEL.COMMITTEE && form.committee) payload.committee = form.committee;
    // The parent district is fixed once an event exists, and district scoped
    // accounts never send one - the backend fills in their own district.
    if (!editing && form.district) payload.district = form.district;

    setSaving(true);
    try {
      if (editing) await updateEvent(editing._id, payload as Partial<EventRecord>);
      else await createEvent(payload as Partial<EventRecord>);
      toast.success(editing ? 'Event updated' : 'Event created');
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
      await deleteEvent(removing._id);
      toast.success(`${removing.title} deleted`);
      setRemoving(null);
      refresh();
    } catch (caught) {
      // The backend refuses to delete an event that already has attendance.
      toast.error(normalizeApiError(caught).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ResourceListPage<EventRecord>
      title="Events"
      description="Meetings, training, awareness programs and community events."
      fetchList={fetchEventList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="startDate"
      itemLabel="events"
      columns={[
        {
          key: 'title',
          header: 'Event',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.title}</p>
              <p className="truncate text-xs text-muted">{row.location ?? 'Location to be announced'}</p>
            </div>
          ),
        },
        {
          key: 'type',
          header: 'Type',
          sortable: true,
          render: (row) => humanize(row.type),
        },
        {
          key: 'startDate',
          header: 'Date',
          sortable: true,
          render: (row) => (
            <span className="whitespace-nowrap text-slate-700">
              {format(new Date(row.startDate), 'MMM d, yyyy')}
              {row.startTime ? ` ${row.startTime}` : ''}
            </span>
          ),
        },
        {
          key: 'unit',
          header: 'Unit',
          priority: false,
          render: (row) => refName(row.unit) ?? refName(row.district) ?? 'â€”',
        },
        {
          key: 'capacity',
          header: 'Capacity',
          priority: false,
          align: 'right',
          render: (row) => row.capacity ?? 'â€”',
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
            can('event.update') || can('event.delete') ? (
              <div className="flex justify-end gap-1">
                {can('event.update') ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => openEdit(row)}
                  >
                    Edit
                  </Button>
                ) : null}
                {can('event.delete') ? (
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
      primaryAction={{ label: 'Add event', hidden: !can('event.create'), onClick: openCreate }}
      filters={[
        {
          name: 'type',
          label: 'Type',
          value: '',
          options: enumOptions(Object.values(EVENT_TYPE), ENUM_LABELS),
        },
        {
          name: 'status',
          label: 'Status',
          value: '',
          options: enumOptions(Object.values(EVENT_STATUS), ENUM_LABELS),
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
        title={editing ? 'Edit event' : 'Add event'}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void save()} loading={saving}>
              {editing ? 'Save changes' : 'Create event'}
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
          <Select
            label="Type"
            required
            value={form.type}
            options={TYPE_OPTIONS}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
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
          {form.level === EVENT_LEVEL.UNIT ? (
            <Select
              label="Unit"
              required
              value={form.unit}
              options={toFilterOptions(units)}
              placeholder="Select a unit"
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          ) : form.level === EVENT_LEVEL.COMMUNITY ? (
            <Select
              label="Community"
              required
              value={form.community}
              options={toFilterOptions(communities)}
              placeholder="Select a community"
              onChange={(e) => setForm({ ...form, community: e.target.value })}
            />
          ) : form.level === EVENT_LEVEL.COMMITTEE ? (
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
            label="Organizer"
            value={form.organizer}
            onChange={(e) => setForm({ ...form, organizer: e.target.value })}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Input
            label="Start date"
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="Start time"
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
          <Input
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <Input
            label="End time"
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
          <Input
            label="Capacity"
            type="number"
            hint="Leave blank when unlimited"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
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
        title="Delete event"
        message={`Delete ${removing?.title ?? 'this event'}? An event that already has attendance marked cannot be deleted.`}
        confirmLabel="Delete event"
        destructive
        loading={deleting}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

export default EventsPage;
