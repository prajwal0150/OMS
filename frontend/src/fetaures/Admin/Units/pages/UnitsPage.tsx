import { ResourceListPage } from '../../../../components';
import { Badge, statusTone } from '../../../../components/ui';
import { useUnits } from '../hooks/useUnits';
import { fetchUnitList } from '../redux/unitThunk';
import type { Unit } from '../../../../types';
import { humanize } from '../../../../types';

export function UnitsPage() {
  const { items, pagination, loading, error } = useUnits();
  

  return (
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
          render: (row) => row.location ?? 'â€”',
        },
        {
          key: 'contact',
          header: 'Contact',
          priority: false,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate text-slate-700">{row.contactPerson ?? 'â€”'}</p>
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
      ]}
      filters={[

      ]}
      
    />
  );
}

export default UnitsPage;
