import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_TEST_URI: z.string().default('mongodb://127.0.0.1:27017/hps_oms_test'),

  JWT_ACCESS_SECRET: z.string().min(10, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('30m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Startup connection retries. Defaults are tuned for a hosted Atlas cluster:
  // a brand new cluster can take several minutes to become writable, and a free
  // M0 pauses when idle and takes about a minute to resume. The default window
  // is roughly five minutes, which covers both. Locally these stay at 0 so a
  // bad URI fails immediately instead of appearing to hang.
  DB_CONNECT_RETRIES: z.coerce.number().int().min(0).max(20).default(5),
  DB_CONNECT_RETRY_DELAY_MS: z.coerce.number().int().min(0).max(60000).default(15000),

  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  SUPER_ADMIN_FIRST_NAME: z.string().default('Super'),
  SUPER_ADMIN_LAST_NAME: z.string().default('Admin'),
  SEED_DEMO_DATA: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  // Opt-in password reset for an already-seeded Super Admin. The seed used to
  // return the existing Super Admin before it ever looked at
  // SUPER_ADMIN_PASSWORD, so editing the password in .env and re-running the
  // seed did nothing and sign-in kept failing with "Invalid email or password".
  // This is deliberately off by default: once the operator has completed the
  // forced password change, an ordinary re-run of the seed must not silently
  // overwrite the password they chose.
  RESET_SUPER_ADMIN_PASSWORD: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  STORAGE_PROVIDER: z.enum(['local', 'cloudinary', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_IMAGE_SIZE_MB: z.coerce.number().default(5),
  MAX_VIDEO_SIZE_MB: z.coerce.number().default(100),
  MAX_DOCUMENT_SIZE_MB: z.coerce.number().default(25),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${details}`);
  process.exit(1);
}

const raw = parsed.data;

// Fail loudly on the classic hosted-deploy mistake: pasting the local
// development URI (mongodb://localhost:27017/...) into Render. There is no
// MongoDB on the Render container's localhost, so mongoose reports
// ECONNREFUSED 127.0.0.1:27017 and the service exits 1. Naming the actual
// problem here saves reading through a TopologyDescription dump.
if (raw.NODE_ENV === 'production' && /^mongodb(\+srv)?:\/\/(localhost|127\.0\.0\.1)/.test(raw.MONGODB_URI)) {
  // eslint-disable-next-line no-console
  console.error(
    'MONGODB_URI points at localhost while NODE_ENV=production.\n' +
      'This host has no local MongoDB; the API cannot start. Set MONGODB_URI to a\n' +
      'hosted cluster such as MongoDB Atlas:\n' +
      '  mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hps_oms?retryWrites=true&w=majority',
  );
  process.exit(1);
}

// A URI with no path component connects to the "test" database. A deploy once
// used ...mongodb.net/?appName=Cluster0, which connected successfully while
// silently pointing every query at "test". Collections were created there, the
// dashboard looked empty because it displayed hps_oms, and the site showed no
// data, with no error anywhere to explain why. A missing database name is
// therefore a startup error, not a default.
const mongoPath = new URL(
  (raw.MONGODB_URI as string).replace('mongodb+srv://', 'mongodb://'),
).pathname;

if (!mongoPath.replace('/', '')) {
  // eslint-disable-next-line no-console
  console.error(
    'MONGODB_URI has no database name, so every query would target "test".\n' +
      'Add /hps_oms after the cluster hostname:\n' +
      '  mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hps_oms?retryWrites=true&w=majority',
  );
  process.exit(1);
}

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  uploadDirAbsolute: path.isAbsolute(raw.UPLOAD_DIR)
    ? raw.UPLOAD_DIR
    : path.resolve(process.cwd(), raw.UPLOAD_DIR),
  clientUrls: raw.CLIENT_URL.split(',')
    .map((value) => value.trim())
    .filter(Boolean),
};

export type Env = typeof env;
