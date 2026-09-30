/**
 * Read-only smoke test for the running API.
 *
 *   npm run smoke            (backend must be running, e.g. npm run dev)
 *
 * Signs in with the super admin credentials from the environment and calls
 * every endpoint surface the web client depends on, so a broken contract or a
 * missing permission is caught immediately. Exits non-zero on any unexpected
 * status code.
 */
import { env } from '../src/config/env';

/* eslint-disable no-console */

const BASE_URL = (process.env.API_BASE_URL ?? `http://localhost:${env.PORT}`).replace(/\/$/, '');

const PUBLIC_ENDPOINTS = [
  '/api/organization/public',
  '/api/organization/branding',
  '/api/districts/public',
  '/api/units/public',
  '/api/communities/public',
  '/api/content/public',
  '/api/content/public/gallery',
  '/api/events/public',
  '/api/announcements/public',
  '/api/documents/public',
  '/api/media/public',
];

const AUTHENTICATED_ENDPOINTS = [
  '/api/auth/me',
  '/api/events/upcoming',
  '/api/organization',
  '/api/districts',
  '/api/units',
  '/api/units/options',
  '/api/communities',
  '/api/communities/options',
  '/api/committees',
  '/api/committees/breakdown',
  '/api/members',
  '/api/members/summary',
  '/api/members/breakdowns',
  '/api/members/accounts',
  '/api/events',
  '/api/attendance',
  '/api/attendance/summary',
  '/api/content',
  '/api/content/stats',
  '/api/announcements',
  '/api/announcements/monthly',
  '/api/media',
  '/api/media/stats',
  '/api/documents',
  '/api/documents/stats',
  '/api/notifications',
  '/api/notifications/unread-count',
  '/api/reports/dashboard',
  '/api/reports/summary/district',
  '/api/reports/summary/units',
  '/api/reports/summary/communities',
  '/api/reports/trend/membership?months=6',
  '/api/reports/history',
  '/api/administrators',
  '/api/administrators/roles',
  '/api/administrators/roles/catalog',
  '/api/permissions',
  '/api/permissions/grouped',
  '/api/roles',
  '/api/roles/catalog',
  '/api/audit-logs',
  '/api/audit-logs/summary',
  '/api/users',
  '/api/settings',
  '/api/contact-messages',
  '/api/search?q=member',
];

interface CheckResult {
  path: string;
  status: number;
  ok: boolean;
  message: string;
}

const call = async (path: string, token?: string): Promise<CheckResult> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let message = '';
  try {
    const body = (await response.json()) as { message?: string };
    message = body.message ?? '';
  } catch {
    message = 'non JSON response';
  }
  return { path, status: response.status, ok: response.status === 200, message };
};

const login = async (): Promise<string> => {
  const email = env.SUPER_ADMIN_EMAIL;
  const password = env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD must be set to run the smoke test');
  }

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Sign in failed with status ${response.status}`);
  }
  const body = (await response.json()) as { data: { accessToken: string } };
  return body.data.accessToken;
};

const main = async (): Promise<void> => {
  const health = await fetch(`${BASE_URL}/health`).catch(() => null);
  if (!health?.ok) {
    console.error(`[smoke] API is not reachable at ${BASE_URL} — start it with "npm run dev"`);
    process.exit(1);
  }

  const token = await login();
  const results: CheckResult[] = [];

  for (const path of PUBLIC_ENDPOINTS) results.push(await call(path));
  for (const path of AUTHENTICATED_ENDPOINTS) results.push(await call(path, token));

  const failures = results.filter((result) => !result.ok);
  for (const result of results) {
    console.log(
      `[smoke] ${result.ok ? 'ok  ' : 'FAIL'} ${String(result.status).padEnd(3)} ${result.path}${
        result.ok ? '' : `  -> ${result.message}`
      }`,
    );
  }

  console.log(
    `[smoke] ${results.length - failures.length}/${results.length} endpoints responded as expected`,
  );
  if (failures.length > 0) process.exit(1);
};

main().catch((error: unknown) => {
  console.error('[smoke] aborted', error);
  process.exit(1);
});
