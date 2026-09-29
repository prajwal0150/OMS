import { ResourceListPage } from '../../../../components';
import { Badge, statusTone } from '../../../../components/ui';
import { useMembers } from '../hooks/useMembers';
import { fetchMemberList } from '../redux/memberThunk';
import type { Member } from '../../../../types';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../hooks/useScopeOptions';
import { ENUM_LABELS, GENDER, MEMBERSHIP_TYPE, MEMBER_STATUS, humanize, refName } from '../../../../types';

export function MembersPage() {
  const { items, pagination, loading, error } = useMembers();
  const { units, communities } = useScopeOptions();

  return (
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
          render: (row) => refName(row.unit) ?? 'â€”',
        },
        {
          key: 'communities',
          header: 'Communities',
          priority: false,
          render: (row) =>
            (row.communities ?? []).map((community) => refName(community)).filter(Boolean).join(', ') || 'â€”',
        },
        {
          key: 'membershipType',
          header: 'Type',
          priority: false,
          sortable: true,
          render: (row) => humanize(row.membershipType),
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
          label: 'MembershipType',
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
      
    />
  );
}

export default MembersPage;
