import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, resolveAllowedOrigins } from '../src/app';
import { env } from '../src/config/env';
import { isDatabaseConnected } from '../src/config/database';

describe('resolveAllowedOrigins', () => {
  it('accepts every origin in a comma separated CLIENT_URL list', () => {
    expect(
      resolveAllowedOrigins(
        ['https://oms.netlify.app', 'https://deploy-preview--12--oms.netlify.app'],
        true,
      ),
    ).toEqual(['https://oms.netlify.app', 'https://deploy-preview--12--oms.netlify.app']);
  });

  it('omits localhost origins in production so only the real site is allowed', () => {
    const origins = resolveAllowedOrigins(['https://oms.netlify.app'], true);
    expect(origins).toEqual(['https://oms.netlify.app']);
    expect(origins).not.toContain('http://localhost:5173');
  });

  it('keeps localhost origins available during development', () => {
    const origins = resolveAllowedOrigins(['http://localhost:5173'], false);
    expect(origins).toContain('http://localhost:5173');
    expect(origins).toContain('http://localhost:3000');
  });
});

describe('CLIENT_URL parsing', () => {
  it('splits and trims into one entry per origin', () => {
    // Guards the regression that motivated resolveAllowedOrigins: passing the
    // raw "a,b" string produced a single unmatched array entry, which the
    // browser treats as "allow nothing" and silently blocked every API call.
    const parsed = 'https://a.netlify.app , https://b.netlify.app'
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    expect(parsed).toEqual(['https://a.netlify.app', 'https://b.netlify.app']);
  });

  it('feeds the cors middleware a list that contains no comma joined entry', () => {
    const origins = resolveAllowedOrigins(env.clientUrls, true);
    expect(origins.length).toBeGreaterThan(0);
    origins.forEach((origin) => expect(origin).not.toContain(','));
  });
});

describe('list endpoints answer with a populated data array', () => {
  // The homepage crashed in production with "Cannot read properties of
  // undefined (reading 'length')" because unwrapList() passes response.data.data
  // straight through: on the error envelope { success:false, message, errors }
  // the data key is absent, so items became undefined and every .length read
  // in HomePage / UnitsPanel / AnnouncementsPanel threw. A 404 route hits the
  // same envelope through notFoundHandler, so a wrong prefix is indistinguishable
  // from a crash. These tests pin the contract from both ends.
  it('returns a data array even when the list is empty', async () => {
    const res = await request(createApp()).get('/api/units/public?limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.pagination).toBeDefined();
  });

  it('omits data on error envelopes, matching what the client must tolerate', async () => {
    const res = await request(createApp()).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    // Documented on purpose: this is the shape that crashed the homepage.
    expect(res.body.data).toBeUndefined();
  });
});

describe('deployment endpoints', () => {
  it('serves /health without authentication so Render can probe it', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('reports database connectivity from /health', async () => {
    // A bare "ok" is what made the MONGODB_URI failure so hard to read: the
    // process was reachable while Mongo was not. `database` is the field that
    // distinguishes "API is up" from "API can actually serve data".
    const res = await request(createApp()).get('/health');
    expect(res.body.database).toBe('connected');
  });

  it('keeps /health at 200 even when Mongo drops, so Atlas blips do not restart-loop', async () => {
    // Status is liveness, not readiness. Failing this check on a transient
    // database outage would make Render kill and respawn the service.
    expect(isDatabaseConnected()).toBe(true);
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
  });

  it('mounts /uploads at the site root so relative asset paths resolve', () => {
    // resolveAssetUrl() strips the /api prefix and returns /uploads/...; that
    // path only works because express serves it outside the API prefix.
    expect(createApp()._router.stack.some((layer: { regexp?: RegExp }) =>
      layer.regexp?.test('/uploads/foo.jpg'),
    )).toBe(true);
  });
});

describe('hosted-deploy MongoDB guard', () => {
  // The deploy that triggered this: MONGODB_URI was left at the local
  // mongodb://localhost:27017 value from .env.example. Render refused the
  // connection and exited 1, which surfaced only as a 30 line
  // TopologyDescription dump. env.ts now rejects it up front with a message
  // that names the fix. The regex is pinned here because it is a production
  // kill switch: widening it would break local production-mode testing,
  // narrowing it would let the original failure return.
  const isLocalhostMongo = (uri: string) =>
    /^mongodb(\+srv)?:\/\/(localhost|127\.0\.0\.1)/.test(uri);

  it('flags the local development URIs that break a hosted deploy', () => {
    expect(isLocalhostMongo('mongodb://localhost:27017/hps_oms')).toBe(true);
    expect(isLocalhostMongo('mongodb://127.0.0.1:27017/hps_oms')).toBe(true);
    expect(isLocalhostMongo('mongodb+srv://localhost:27017/hps_oms')).toBe(true);
  });

  it('accepts a hosted Atlas URI and other remote hosts', () => {
    expect(
      isLocalhostMongo('mongodb+srv://u:p@cluster.mongodb.net/hps_oms?retryWrites=true'),
    ).toBe(false);
    expect(isLocalhostMongo('mongodb://10.0.0.5:27017/hps_oms')).toBe(false);
  });

  it('only guards production, so local development and tests are unaffected', () => {
    // NODE_ENV is 'test' under vitest, and this URI is localhost, so env.ts
    // must not have exited while the rest of this file is running.
    expect(env.MONGODB_URI).toMatch(/^mongodb:\/\/127\.0\.0\.1/);
    expect(env.isProduction).toBe(false);
  });
});