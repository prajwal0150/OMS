import { ResourceListPage } from '../../../../components';
import { Badge, statusTone } from '../../../../components/ui';
import { useCommittees } from '../hooks/useCommittees';
import { fetchCommitteeList } from '../redux/committeeThunk';
import type { Committee } from '../../../../types';
import { enumOptions, toFilterOptions, useScopeOptions } from '../../../../hooks/useScopeOptions';
import { COMMITTEE_LEVEL, ENUM_LABELS, RECORD_STATUS, humanize, refName } from '../../../../types';

export function CommitteesPage() {
  const { items, pagination, loading, error } = useCommittees();
  const { units, communities } = useScopeOptions();

  return (
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
      ]}
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
  );
}

export default CommitteesPage;
