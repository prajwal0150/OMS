/**
 * Vitest bootstrap.
 *
 * The environment is pinned to the dedicated test database BEFORE any
 * application module is imported, because `src/config/env.ts` snapshots
 * `process.env` at import time (dotenv never overwrites existing variables).
 * Every suite therefore runs against an isolated, disposable database — it is
 * dropped before and after the run and the guard below makes it impossible to
 * wipe the development database by accident.
 */
import mongoose from 'mongoose';
import { afterAll, beforeAll } from 'vitest';

const TEST_MONGODB_URI =
  process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27017/hps_oms_test';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = TEST_MONGODB_URI;
process.env.SEED_DEMO_DATA = 'false';
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.JWT_ACCESS_EXPIRES_IN = '30m';

beforeAll(async () => {
  const { connectDatabase } = await import('../src/config/database');
  await connectDatabase();

  const databaseName = mongoose.connection.name;
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run integration tests against "${databaseName}". ` +
        'Set MONGODB_TEST_URI to a disposable *_test database.',
    );
  }

  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
