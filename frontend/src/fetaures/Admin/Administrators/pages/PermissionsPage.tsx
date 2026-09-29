import { useMemo, useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Section,
} from '../../../../components';
import { PERMISSION_GROUPS, type Permission } from '../../../../types';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthState } from '../../../Auth/hooks/useAuth';

/**
 * Read only permission reference. Roles and grants live on the Roles screen;
 * this page documents what every permission key actually allows.
 */
export function PermissionsPage() {
  const { permissions } = usePermissions();
  const { user } = useAuthState();
  const [query, setQuery] = useState('');

  const granted = useMemo(
    () => new Set<Permission>((user?.permissions ?? []) as Permission[]),
    [user?.permissions],
  );

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return PERMISSION_GROUPS;
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (permission) =>
          permission.toLowerCase().includes(term) ||
          permissions.find((entry) => entry.key === permission)?.label
            ?.toLowerCase()
            .includes(term),
      ),
    })).filter((group) => group.permissions.length > 0);
  }, [query, permissions]);

  const copyAll = async (permissionsToCopy: string[]) => {
    await navigator.clipboard.writeText(permissionsToCopy.join('\n'));
    toast.success('Permissions copied to clipboard');
  };

  return (
    <div>
      <PageHeader
        title="Permissions"
        description="Every permission key in the system, the module it belongs to and whether your role holds it."
        breadcrumb={[{ label: 'Admin' }, { label: 'Permissions' }]}
        actions={
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Copy className="h-3.5 w-3.5" />}
            onClick={() => void copyAll(permissions.map((entry) => entry.key))}
          >
            Copy all keys
          </Button>
        }
      />

      <div className="relative mb-3 max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter permissions..."
          aria-label="Filter permissions"
          containerClassName="pl-8"
        />
      </div>

      {groups.length === 0 ? (
        <Card padding="none">
          <p className="p-8 text-center text-sm text-muted">No permission matches your search.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Section
              key={group.module}
              title={group.module}
              description={group.description}
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => void copyAll(group.permissions as string[])}
                >
                  Copy module
                </Button>
              }
            >
              <Card padding="none">
                <ul className="divide-y divide-line">
                  {group.permissions.map((permission) => {
                    const held = granted.has(permission);
                    return (
                      <li
                        key={permission}
                        className="flex flex-wrap items-center gap-2 px-3 py-2"
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                            held ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-300'
                          }`}
                        >
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-800">
                            {permissions.find((entry) => entry.key === permission)?.label ?? permission}
                          </p>
                          <p className="truncate font-mono text-[11px] text-muted">{permission}</p>
                        </div>
                        <Badge tone={held ? 'success' : 'neutral'}>
                          {held ? 'Granted' : 'Not held'}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}

export default PermissionsPage;
