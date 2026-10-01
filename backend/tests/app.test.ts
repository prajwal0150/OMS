import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, resolveAllowedOrigins } from '../src/app';
import { env } from '../src/config/env';
import { describeConnectionError, isDatabaseConnected } from '../src/config/database';

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


describe('connection failure diagnostics', () => {
  // A Render deploy that fails with "bad auth : Authentication failed" and one
  // that fails with a paused cluster look identical in a raw driver stack: both
  // are just a rejected promise. describeConnectionError turns the code the
  // driver already attaches into a sentence that names the next action, which
  // is the difference between a five minute fix and a redeploy loop.
  it('names the credential cause for AtlasError 8000', () => {
    const message = describeConnectionError({
      code: 8000,
      codeName: 'AtlasError',
      message: 'bad auth : Authentication failed.',
    });
    expect(message).toMatch(/credentials/i);
    expect(message).toMatch(/Database Access/);
    // The whole point: it must tell the operator what is NOT broken, so they
    // stop re-checking the allowlist and the hostname.
    expect(message).toMatch(/allowlist/i);
    // "bad auth" is an authentication failure, never an authorization one. Two
    // users with atlasAdmin@admin were checked at length before it was clear
    // that the role was never the problem, so the message rules that out.
    expect(message).toMatch(/atlasAdmin@admin all work/);
    expect(message).toMatch(/not authorized/);
  });

  it('also recognises bad auth from the message when no code is attached', () => {
    expect(describeConnectionError(new Error('bad auth : Authentication failed.'))).toMatch(
      /credentials/i,
    );
  });

  it('points a refused connection at a missing server or localhost', () => {
    const message = describeConnectionError(new Error('connect ECONNREFUSED 127.0.0.1:27017'));
    expect(message).toMatch(/refused/i);
    expect(message).toMatch(/localhost/i);
  });

  it('points a DNS failure at a bad hostname', () => {
    expect(describeConnectionError(new Error('getaddrinfo ENOTFOUND cluster0.abcde'))).toMatch(
      /did not resolve/i,
    );
  });
});

describe('MONGODB_URI database name', () => {
  // A hosted deploy once used "mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0".
  // That connects cleanly and every query lands in "test", so the app appears to
  // work while the hps_oms database stays empty and the site renders no data. A
  // URI with no path segment must be a configuration error rather than a silent
  // default, exactly like the localhost guard above, and env.ts now exits on it.
  const hasDatabaseName = (uri: string): boolean =>
    new URL(uri.replace('mongodb+srv://', 'mongodb://')).pathname.replace('/', '') !== '';

  it('rejects a URI that would silently target the "test" database', () => {
    expect(hasDatabaseName('mongodb+srv://u:p@cluster.mongodb.net/?appName=Cluster0')).toBe(false);
    expect(hasDatabaseName('mongodb://u:p@cluster.mongodb.net/')).toBe(false);
    expect(hasDatabaseName('mongodb://u:p@cluster.mongodb.net')).toBe(false);
  });

  it('accepts a URI that names a database', () => {
    expect(hasDatabaseName('mongodb+srv://u:p@cluster.mongodb.net/hps_oms?retryWrites=true')).toBe(
      true,
    );
    expect(hasDatabaseName('mongodb://localhost:27017/hps_oms')).toBe(true);
  });

  it('does not fire for the local test URI, so the suite still loads env.ts', () => {
    expect(hasDatabaseName(env.MONGODB_URI)).toBe(true);
  });

});

describe('connection failure diagnostics', () => {
  it('classifies a no-primary topology failure as reachability, not credentials', () => {
    // The exact shape Render produced after the credentials were fixed:
    // MongooseServerSelectionError with a nested TopologyDescription. The old
    // classifier only matched on the message text, missed this entirely, and
    // reported "Unexpected connection failure" - which is the least helpful
    // possible answer when the actual fix is one click in the IP Access List.
    const message = describeConnectionError({
      name: 'MongooseServerSelectionError',
      message:
        'Could not connect to any servers in your MongoDB Atlas cluster. One common reason ' +
        'is that you are trying to access the database from an IP that is not whitelisted.',
      code: undefined,
      reason: {
        type: 'ReplicaSetNoPrimary',
        setName: 'atlas-vbu888-shard-0',
        commonWireVersion: 0,
        logicalSessionTimeoutMinutes: null,
      },
    });

    expect(message).toMatch(/IP Access List/);
    expect(message).toMatch(/0\.0\.0\.0\/0/);
    expect(message).toMatch(/paused|provisioning/i);
    // The critical distinction: this must NOT send the operator to Database
    // Access, because the credentials are already correct at this point.
    expect(message).not.toMatch(/Database Access/);
    expect(message).not.toMatch(/credentials are wrong/);
  });

  it('recognises a no-primary failure that carries only the message', () => {
    // No nested reason: the classifier must still work off the message alone.
    expect(
      describeConnectionError(new Error('Could not connect to any servers in your cluster')),
    ).toMatch(/IP Access List/);
  });

  it('keeps the credential diagnosis for a real 8000', () => {
    // Guard against the two branches overlapping: 8000 must not be swallowed by
    // the broader "cannot connect to any servers" match above.
    const message = describeConnectionError({
      code: 8000,
      message: 'bad auth : Authentication failed.',
    });
    expect(message).toMatch(/credentials/i);
    expect(message).toMatch(/Database Access/);
  });

  it('points a timeout at the IP allowlist and a paused cluster', () => {
    // The Atlas M0 case: the cluster auto-pauses when idle and can take up to a
    // minute to resume, which is why startup now retries instead of exiting.
    const message = describeConnectionError(new Error('Server selection timed out after 10000 ms'));
    expect(message).toMatch(/IP Access List/);
    expect(message).toMatch(/paused/i);
  });

  it('falls back to a generic message rather than throwing on an odd error', () => {
    expect(describeConnectionError(new Error('something odd'))).toMatch(/Unexpected/i);
    expect(describeConnectionError(undefined)).toMatch(/Unexpected/i);
  });
});