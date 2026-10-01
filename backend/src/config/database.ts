import mongoose from 'mongoose';
import { env } from './env';

let connection: typeof mongoose | null = null;

/** Ceiling for a single backoff wait, so a large retryDelayMs cannot stall a deploy. */
const MAX_RETRY_DELAY_MS = 60000;

/**
 * Observes an already-established connection.
 *
 * connectDatabase() only covers the FIRST connection. Without these listeners a
 * connection that drops later - an Atlas M0 waking from a pause, a brief
 * network partition, a shared-node failover - is completely invisible: /health
 * silently flips to "disconnected", every query hangs until it times out, and
 * the logs contain nothing at all to explain it. That silence is what makes an
 * intermittent failure so hard to chase. Logging the transitions is the minimum
 * needed to tell "the cluster paused" apart from "the app is broken".
 */
export const observeConnection = (): void => {
  const connection = mongoose.connection;

  connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log(`[database] state -> connected (${connection.name})`);
  });

  connection.on('disconnected', () => {
    // A transient drop is normal on a paused or failing-over cluster and the
    // driver reconnects on its own, so this is a warning rather than an error.
    // eslint-disable-next-line no-console
    console.warn('[database] state -> disconnected; the driver will attempt to reconnect');
  });

  connection.on('reconnected', () => {
    // eslint-disable-next-line no-console
    console.log('[database] state -> connected (reconnected)');
  });

  connection.on('error', (error: Error) => {
    // eslint-disable-next-line no-console
    console.error('[database] connection error:', describeConnectionError(error));
  });
};

/**
 * Classifies a connection failure so the operator sees a cause rather than a
 * MongoDB driver stack trace. Kept separate from connectDatabase so it can be
 * unit tested without touching the network.
 */
export const describeConnectionError = (error: unknown): string => {
  const err = error as { code?: number | string; codeName?: string; message?: string };
  const message = err?.message ?? String(error);
  // MongooseServerSelectionError wraps a driver TopologyDescription. The
  // nested reason names the topology state, which distinguishes "cannot reach
  // the cluster at all" from "reached it, credentials wrong".
  const nested = (err as { reason?: { type?: string } } | null)?.reason?.type ?? '';
  const details = [message, nested].filter(Boolean).join(' | ');

  if (err?.code === 8000 || /bad auth/i.test(details)) {
    return (
      'MongoDB rejected the credentials (AtlasError 8000: "bad auth"). The cluster was ' +
      'reached, so the host, URI format and network allowlist are all correct. In Atlas > ' +
      'Database Access, confirm the username matches exactly (a typo fails identically to a ' +
      'wrong password), the password is the current one rather than one already rotated out, ' +
      'and the user is not suspended. Any role that can write hps_oms is enough - ' +
      'readWrite, readWriteAnyDatabase and atlasAdmin@admin all work, so do not spend time ' +
      'on permissions when Atlas reported "bad auth" rather than "not authorized". ' +
      'Note that with more than one user present it is easy to hold the one-time password ' +
      'of a different user than the one in the URI; delete the extra users and create one ' +
      'fresh user with a password you record immediately.'
    );
  }

  // Server selection failure with no primary. Atlas resolved the SRV record and
  // the driver opened sockets, but no replica set member completed a handshake:
  // commonWireVersion stays 0 and logicalSessionTimeoutMinutes is null. That
  // points at the network or at a cluster that is not running, never at
  // credentials, so say so plainly rather than reporting an unknown error.
  if (/ReplicaSetNoPrimary|Could not connect to any servers|Server selection/i.test(details)) {
    return (
      'Atlas resolved the cluster but no replica set member answered the handshake ' +
      '(no primary). The credentials are fine and the URI is fine; this is reachability. ' +
      'Two causes account for nearly all of these. First, the Render container IP is not ' +
      'in the allowlist: in Atlas open Network Access > IP Access List and add 0.0.0.0/0 ' +
      '(Render outbound IPs are dynamic, so a static allowlist cannot work). Second, the ' +
      'cluster is paused or still provisioning: free M0 clusters auto-pause when idle and ' +
      'can take a minute to resume, and a brand new cluster is not ready for connections ' +
      'for a few minutes after creation. Open the cluster in Atlas and confirm it shows ' +
      'Active, then deploy again. Startup retries for roughly five minutes, which usually ' +
      'covers a resuming or newly provisioned cluster, so wait for the cluster to reach ' +
      'Active before redeploying rather than redeploying immediately.'
    );
  }

  if (/ENOTFOUND|EAI_AGAIN/.test(details)) {
    return (
      'The cluster hostname did not resolve. Check for a typo in MONGODB_URI and that the ' +
      'Atlas cluster has not been deleted.'
    );
  }

  if (/ECONNREFUSED/.test(details)) {
    return (
      'The connection was refused. A mongodb:// host with no server, or a mongodb+srv URI ' +
      'pointing at localhost, produces this.'
    );
  }

  return 'Unexpected connection failure.';
};

export const connectDatabase = async (
  uri: string = env.MONGODB_URI,
  options: { retries?: number; retryDelayMs?: number } = {},
): Promise<typeof mongoose> => {
  if (connection) return connection;

  mongoose.set('strictQuery', true);
  // NOTE: `sanitizeFilter` is deliberately NOT enabled. It rewrites nested
  // operator objects such as { publishedAt: { $lte: new Date() } } into an
  // equality comparison, which makes Mongoose try to cast the whole object to
  // a Date and throws "Cast to date failed ... (type Object)". Every range and
  // comparison filter in this codebase depends on those operators.
  // Injection safety is handled upstream by Zod validation plus the Zod allow
  // lists in shared/validation.ts, which strip unknown query keys.
  if (env.isDevelopment) {
    mongoose.set('debug', false);
  }

  const { retries = 0, retryDelayMs = 5000 } = options;
  let lastError: unknown;

  // Retries matter on a hosted cluster: an Atlas M0 pauses when idle and resumes
  // on first contact, and shared clusters briefly fail over. Without a retry, a
  // blip during a Render deploy exits the process and the service stays down
  // until someone redeploys by hand.
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      connection = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 20,
        // --- settings that directly reduce intermittent failures ---
        // An idle pooled socket held across an Atlas M0 pause is dead on arrival:
        // the node was reclaimed while the socket sat unused, so the next query
        // fails on a connection that "looked" healthy. Capping idle time keeps
        // the pool from handing out stale sockets. 30s sits well under the pause
        // threshold.
        maxIdleTimeMS: 30000,
        // Fail fast if a socket cannot be established, rather than leaving the
        // request pending for the default 30s.
        connectTimeoutMS: 10000,
      });

      observeConnection();

      // eslint-disable-next-line no-console
      console.log(`[database] connected -> ${mongoose.connection.name}`);
      return connection;
    } catch (error) {
      lastError = error;
      // A partially established connection would make the next iteration see a
      // non-null `connection` and skip straight past the retry loop.
      connection = null;

      if (attempt < retries) {
        // Exponential backoff, capped. Linear growth front-loads its waits and
        // burns most of the window early, which is backwards for a cluster
        // that is still coming up: the later attempts are the ones likely to
        // succeed, so they need the most time to pay off.
        const wait = Math.min(retryDelayMs * 2 ** attempt, MAX_RETRY_DELAY_MS);
        // eslint-disable-next-line no-console
        console.warn(
          `[database] connection attempt ${attempt + 1}/${retries + 1} failed, retrying in ${wait}ms`,
        );
        await new Promise((resolve) => {
          setTimeout(resolve, wait);
        });
      }
    }
  }

  // Wrapping the driver error replaces its stack with an actionable cause while
  // keeping the original available via `cause` for anyone who needs the detail.
  throw new Error(describeConnectionError(lastError), { cause: lastError });
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!connection) return;
  await mongoose.disconnect();
  connection = null;
};

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;
