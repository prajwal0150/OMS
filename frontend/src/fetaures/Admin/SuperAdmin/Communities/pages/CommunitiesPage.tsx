import { ResourceListPage } from '../../../../../components';
import { Badge, statusTone } from '../../../../../components/ui';
import { refName } from '../../../../../types';
import { useCommunities } from '../hooks/useCommunities';
import { fetchCommunityList } from '../redux/communityThunk';
import type { Community } from '../../../../../types';
import { humanize } from '../../../../../types';

export function CommunitiesPage() {
  const { items, pagination, loading, error } = useCommunities();
  

  return (
    <ResourceListPage<Community>
      title="Communities"
      description="Parents, Women and Youth communities operating across the district."
      fetchList={fetchCommunityList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="name"
      itemLabel="communities"
      columns={[
        {
          key: 'name',
          header: 'Community',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.name}</p>
              <p className="text-xs text-muted">{row.code}</p>
            </div>
          ),
        },
        {
          key: 'targetGroup',
          header: 'Target group',
          sortable: true,
          render: (row) => (
            <Badge tone="purple">{humanize(row.targetGroup)}</Badge>
          ),
        },
        {
          key: 'ageGroup',
          header: 'Age group',
          priority: false,
          render: (row) => row.ageGroup ?? 'â€”',
        },
        {
          key: 'unit',
          header: 'Unit',
          priority: false,
          render: (row) => refName(row.unit) ?? 'District-wide',
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

      ]}
      
    />
  );
}

export default CommunitiesPage;
