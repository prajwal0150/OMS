import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  Section,
} from '../../../../../components';
import { PERMISSION_GROUPS, type Permission } from '../../../../../types';
import {
  fetchPermissionCatalog,
  fetchRoles,
  updateRolePermissions,
} from '../services/administratorService';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import type { PermissionCatalogEntry, RoleRecord } from '../../../../../types';

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) => group.permissions);

/** Roles and the permissions they grant. A change affects every holder. */
export function RolesPage() {
  const { can } = useAuthState();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [selected, setSelected] = useState<Set<Permission>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roleList, catalogList] = await Promise.all([
        fetchRoles({ limit: 50 }),
        fetchPermissionCatalog(),
      ]);
      setRoles(roleList.items);
      setCatalog(catalogList);
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (role: RoleRecord) => {
    setEditing(role);
    setSelected(new Set(role.permissions as Permission[]));
  };

  const toggle = (permission: Permission) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  };

  const toggleGroup = (permissions: Permission[]) => {
    setSelected((current) => {
      const next = new Set(current);
      const allOn = permissions.every((permission) => next.has(permission));
      permissions.forEach((permission) => (allOn ? next.delete(permission) : next.add(permission)));
      return next;
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateRolePermissions(editing._id, [...selected]);
      toast.success(`Permissions updated for ${editing.label}`);
      setEditing(null);
      void load();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading roles..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Database backed roles and the permissions they grant. Changes apply to every holder of the role."
        breadcrumb={[{ label: 'Admin' }, { label: 'Roles' }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => (
          <Card key={role._id}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </div>
              <Badge tone={role.isSystem ? 'neutral' : 'info'}>
                {role.isSystem ? 'System' : 'Custom'}
              </Badge>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-secondary">{role.label}</h3>
            <p className="font-mono text-xs text-muted">{role.name}</p>
            <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{role.description}</p>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <span className="text-xs text-muted">
                {role.permissionCount} of {ALL_PERMISSIONS.length} permissions
              </span>
              {can('role.manage') && (
                <Button size="sm" variant="ghost" onClick={() => openEditor(role)}>
                  Edit
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Permissions for ${editing.label}` : 'Permissions'}
        description={`${selected.size} of ${ALL_PERMISSIONS.length} permissions granted`}
        size="xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void save()} loading={saving}>
              Save permissions
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {PERMISSION_GROUPS.map((group) => {
            const allOn = group.permissions.every((permission) => selected.has(permission));
            return (
              <Section
                key={group.module}
                title={group.module}
                actions={
                  <Button size="sm" variant="ghost" onClick={() => toggleGroup(group.permissions)}>
                    {allOn ? 'Clear' : 'Select all'}
                  </Button>
                }
              >
                <Card>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {group.permissions.map((permission) => (
                      <li key={permission}>
                        <label className="flex items-start gap-2 rounded-lg px-2 py-1 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-3.5 w-3.5 rounded border-line accent-primary"
                            checked={selected.has(permission)}
                            onChange={() => toggle(permission)}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm text-slate-700">
                              {catalog.find((entry) => entry.key === permission)?.label ?? permission}
                            </span>
                            <span className="block truncate font-mono text-[11px] text-muted">
                              {permission}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Section>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

export default RolesPage;
