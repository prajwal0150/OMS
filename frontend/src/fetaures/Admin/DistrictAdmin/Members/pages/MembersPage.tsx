import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ResourceListPage, ConfirmDialog, Button } from '../../../../../components';
import { Badge, statusTone } from '../../../../../components/ui';
import { useMembers } from '../hooks/useMembers';
import { fetchMemberList } from '../redux/memberThunk';
import { deleteMember } from '../services/memberService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import type { Member } from '../../../../../types';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../../hooks/useScopeOptions';
import { ENUM_LABELS, GENDER, MEMBERSHIP_TYPE, MEMBER_STATUS, humanize, refName } from '../../../../../types';

export function MembersPage() {
  const navigate = useNavigate();
  const { can } = useAuthState();
  const { items, pagination, loading, error, refresh } = useMembers();
  const { units, communities } = useScopeOptions();
  const [removing, setRemoving] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const nameOf = (row: Member) =>
    row.fullName ?? [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ');

  const confirmRemove = async () => {
    if (!removing) return;
    setDeleting(true);
    try {
      await deleteMember(removing._id);
      toast.success(`${removing.memberId} deleted`);
      setRemoving(null);
      refresh();
    } catch (caught) {
      // The backend refuses to delete a member that still has a login account or
      // an active committee seat; the message says which one.
      toast.error(normalizeApiError(caught).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ResourceListPage<Member>
      title="Members"
      description="Every member inside your assigned organizational scope."
      fetchList={fetchMemberList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="createdAt"
      itemLabel="members"
      columns={[
        {
          key: 'memberId',
          header: 'Member ID',
          sortable: true,
          render: (row) => <span className="font-mono text-xs text-slate-600">{row.memberId}</span>,
        },
        {
          key: 'name',
          header: 'Name',
          sortable: true,
          render: (row) => (
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                {row.firstName?.[0]}
                {row.lastName?.[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">
                  {row.fullName ?? [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ')}
                </p>
                <p className="truncate text-xs text-muted">{row.email ?? row.phone ?? ''}</p>
              </div>
            </div>
          ),
        },
        {
          key: 'unit',
          header: 'Unit',
          priority: false,
          render: (row) => refName(row.unit) ?? '—',
        },
        {
          key: 'communities',
          header: 'Communities',
          priority: false,
          render: (row) =>
            (row.communities ?? []).map((community) => refName(community)).filter(Boolean).join(', ') || '—',
        },
        {
          key: 'membershipType',
          header: 'Membership Type',
          priority: false,
          sortable: true,
          render: (row) => <Badge tone="primary">{humanize(row.membershipType)}</Badge>,
        },
        {
          key: 'address',
          header: 'Address',
          priority: false,
          render: (row) => row.address ?? '—',
        },
        {
          key: 'municipality',
          header: 'Municipality',
          priority: false,
          sortable: true,
          render: (row) => row.municipality ?? '—',
        },
        {
          key: 'ward',
          header: 'Ward',
          priority: false,
          sortable: true,
          render: (row) => row.ward ?? '—',
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          render: (row) => (
            <span className="inline-flex flex-wrap items-center gap-1">
              <Badge tone={statusTone(row.status)} dot>
                {humanize(row.status)}
              </Badge>
              {row.registrationStatus === 'PENDING' && (
                <Badge tone="warning">Awaiting approval</Badge>
              )}
              {row.registrationStatus === 'REJECTED' && (
                <Badge tone="danger">Rejected</Badge>
              )}
            </span>
          ),
        },
        {
          key: 'actions',
          header: '',
          align: 'right',
          render: (row) =>
            can('member.update') || can('member.delete') ? (
              <div className="flex justify-end gap-1">
                {can('member.update') ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => navigate(`/admin/members/${row._id}/edit`)}
                  >
                    Edit
                  </Button>
                ) : null}
                {can('member.delete') ? (
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
      filters={[
        {
          name: 'status',
          label: 'Status',
          value: '',
          options: enumOptions(Object.values(MEMBER_STATUS), ENUM_LABELS),
        },
        {
          name: 'membershipType',
          label: 'Membership Type',
          value: '',
          options: enumOptions(Object.values(MEMBERSHIP_TYPE), ENUM_LABELS),
        },
        {
          name: 'gender',
          label: 'Gender',
          value: '',
          options: enumOptions(Object.values(GENDER), ENUM_LABELS),
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
      primaryAction={{
        label: 'Add member',
        hidden: !can('member.create'),
        onClick: () => navigate('/admin/members/new'),
      }}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete member"
        message={`Delete ${removing ? nameOf(removing) : 'this member'}? A member that still has a login account or an active committee position cannot be deleted.`}
        confirmLabel="Delete member"
        destructive
        loading={deleting}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

export default MembersPage;
