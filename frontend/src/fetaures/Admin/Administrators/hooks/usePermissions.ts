import { useCallback, useEffect, useState } from 'react';
import { fetchPermissionCatalog } from '../services/administratorService';
import { normalizeApiError } from '../../../../services/api/apiClient';
import type { PermissionCatalogEntry } from '../../../../types';

export interface UsePermissionsResult {
  permissions: PermissionCatalogEntry[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads the flat permission catalog (key, label, module, description). */
export function usePermissions(): UsePermissionsResult {
  const [permissions, setPermissions] = useState<PermissionCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPermissions(await fetchPermissionCatalog());
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, tick]);

  return { permissions, loading, error, reload: () => setTick((value) => value + 1) };
}
