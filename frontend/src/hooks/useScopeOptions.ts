import { useEffect, useState } from 'react';
import {
  fetchCommitteeOptions,
  fetchCommunityOptions,
  fetchUnitOptions,
} from '../fetaures/Admin/Organization/services/organizationService';
import type { Committee, OptionItem } from '../types';

export interface ScopeOptions {
  units: OptionItem[];
  communities: OptionItem[];
  committees: Committee[];
  loading: boolean;
}

/**
 * Scoped option lists (units, communities, committees) used by every filter and
 * picker. The backend already limits these to the caller's scope.
 */
export function useScopeOptions(): ScopeOptions {
  const [units, setUnits] = useState<OptionItem[]>([]);
  const [communities, setCommunities] = useState<OptionItem[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetchUnitOptions(), fetchCommunityOptions(), fetchCommitteeOptions()])
      .then(([unitList, communityList, committeeList]) => {
        if (!active) return;
        setUnits(unitList);
        setCommunities(communityList);
        setCommittees(committeeList.items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { units, communities, committees, loading };
}

/** Converts option items into the `{ value, label }` shape used by filters. */
export const toFilterOptions = (items: Array<{ _id: string; name: string }>) =>
  items.map((item) => ({ value: item._id, label: item.name }));

/** Enum values as `{ value, label }` pairs. */
export const enumOptions = (values: readonly string[], labels: Record<string, string>) =>
  values.map((value) => ({ value, label: labels[value] ?? value }));
