import { useState } from 'react';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { ResourceListPage, Modal, Button, Input, Textarea, Select, Badge, statusTone } from '../../../../components';
import { useDistricts } from '../hooks/useDistricts';
import { fetchDistrictList } from '../redux/districtThunk';
import { createDistrict, updateDistrict } from '../services/districtService';
import { normalizeApiError } from '../../../../services/api/apiClient';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import { RECORD_STATUS, humanize, type District } from '../../../../types';

const STATUS_OPTIONS = Object.values(RECORD_STATUS).map((value) => ({
  value,
  label: humanize(value),
}));

interface FormState {
  name: string;
  code: string;
  province: string;
  country: string;
  description: string;
  status: string;
}

const EMPTY: FormState = {
  name: '',
  code: '',
  province: 'Koshi Province',
  country: 'Nepal',
  description: '',
  status: 'ACTIVE',
};

/**
 * District administration. The platform is seeded with Sunsari; districts and
 * units remain database entities and authorization is never keyed off the name.
 */
export function DistrictAdminPage() {
  const { can } = useAuthState();
  const { items, pagination, loading, error, refresh } = useDistricts();
  const [editing, setEditing] = useState<District | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (district: District) => {
    setEditing(district);
    setForm({
      name: district.name,
      code: district.code,
      province: district.province,
      country: district.country,
      description: district.description ?? '',
      status: district.status,
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await updateDistrict(editing._id, form as unknown as Partial<District>);
      else await createDistrict(form as unknown as Partial<District>);
      toast.success(editing ? 'District updated' : 'District created');
      setOpen(false);
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ResourceListPage<District>
        title="District"
        description="The district this organization is registered in."
        fetchList={fetchDistrictList}
        items={items}
        pagination={pagination}
        loading={loading}
        error={error}
        rowKey={(row) => row._id}
        defaultSort="name"
        defaultOrder="asc"
        itemLabel="districts"
        primaryAction={{ label: 'Add district', hidden: !can('district.update'), onClick: openCreate }}
        columns={[
          {
            key: 'name',
            header: 'District',
            sortable: true,
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{row.name}</p>
                <p className="truncate text-xs text-muted">{row.code}</p>
              </div>
            ),
          },
          {
            key: 'province',
            header: 'Province',
            priority: false,
            sortable: true,
            render: (row) => row.province,
          },
          { key: 'country', header: 'Country', priority: false, render: (row) => row.country },
          {
            key: 'contact',
            header: 'Contact',
            priority: false,
            render: (row) => row.contact?.email ?? row.contact?.phone ?? '--',
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
              can('district.update') ? (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={() => openEdit(row)}
                >
                  Edit
                </Button>
              ) : null,
          },
        ]}
        filters={[{ name: 'status', label: 'Status', value: '', options: STATUS_OPTIONS }]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit district' : 'Add district'}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void save()} loading={saving}>
              {editing ? 'Save changes' : 'Create district'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
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
          <Input
            label="Province"
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
          />
          <Input
            label="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />
        </div>
      </Modal>
    </>
  );
}

export default DistrictAdminPage;
