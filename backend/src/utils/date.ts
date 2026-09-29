export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '—';
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '—';
  return value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date: Date | string | undefined | null): string => {
  if (!date) return '—';
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '—';
  return `${formatDate(value)} ${value.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const monthLabel = (key: string): string => {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, 1));
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

export const buildMonthlyRange = (months: number, from: Date = new Date()): string[] => {
  const keys: string[] = [];
  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(from.getFullYear(), from.getMonth() - index, 1);
    keys.push(monthKey(date));
  }
  return keys;
};

export const parseDateParam = (value: unknown): Date | undefined => {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};
