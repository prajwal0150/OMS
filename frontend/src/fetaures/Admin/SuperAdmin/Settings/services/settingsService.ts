import apiClient, { unwrap } from '../../../../../services/api/apiClient';

/** Flat key/value map of runtime settings stored in MongoDB. */
export type SettingsMap = Record<string, string | number | boolean>;

export const fetchSettings = async (): Promise<SettingsMap> =>
  unwrap(await apiClient.get<{ data: SettingsMap }>('/settings'));

/** Partial update. The backend merges and returns the full effective map. */
export const updateSettings = async (values: SettingsMap): Promise<SettingsMap> =>
  unwrap(await apiClient.put<{ data: SettingsMap }>('/settings', values));
