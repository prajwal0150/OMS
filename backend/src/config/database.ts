import mongoose from 'mongoose';
import { env } from './env';

let connection: typeof mongoose | null = null;

/**
 * Classifies a connection failure so the operator sees a cause rather than a
 * MongoDB driver stack trace. Kept separate from connectDatabase so it can be
 * unit tested without touching the network.
 */
export const describeConnectionError = (error: unknown): string => {
  const err = error as { code?: number | string; codeName?: string; message?: string };
  const message = err?.message ?? String(error);

  if (err?.code === 8000 || /bad auth/i.test(message)) {
    return (
      'MongoDB rejected the credentials (AtlasError 8000: "bad auth"). The cluster was ' +
      'reached, so the host, URI format and network allowlist are all correct. In Atlas > ' +
      'Database Access, confirm the username matches exactly (a typo fails identically to a ' +
      'wrong password), the password is the current one rather than one already rotated out, ' +
      'and the user is not suspended and holds readWriteAnyDatabase on this cluster.'
    );
  }

  if (/ENOTFOUND|EAI_AGAIN/.test(message)) {
    return (
      'The cluster hostname did not resolve. Check for a typo in MONGODB_URI and that the ' +
      'Atlas cluster has not been deleted.'
    );
  }

  if (/ECONNREFUSED/.test(message)) {
    return (
      'The connection was refused. A mongodb:// host with no server, or a mongodb+srv URI ' +
      'pointing at localhost, produces this.'
    );
  }

  if (/timed out|Server selection/i.test(message)) {
    return (
      'The cluster did not answer within serverSelectionTimeoutMS. In Atlas > Network ' +
      'Access > IP Access List, allow Render outbound traffic (0.0.0.0/0 unless a static ' +
      'outbound IP is configured), and confirm the cluster is not paused. Free M0 clusters ' +
      'auto-pause when idle and can take up to a minute to resume.'
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
      });

      // eslint-disable-next-line no-console
      console.log(`[database] connected -> ${mongoose.connection.name}`);
      return connection;
    } catch (error) {
      lastError = error;
      // A partially established connection would make the next iteration see a
      // non-null `connection` and skip straight past the retry loop.
      connection = null;

      if (attempt < retries) {
        const wait = retryDelayMs * (attempt + 1);
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
