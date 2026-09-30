/**
 * Temporary diagnostics helper: prints per-collection document counts for the
 * currently configured database so seeding / dashboard issues can be checked.
 *
 *   npx tsx scripts/diag-data.ts
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { env } from '../src/config/env';

const COLLECTIONS = [
  'permissions',
  'roles',
  'organizations',
  'users',
  'districts',
  'units',
  'communities',
  'committees',
  'members',
  'events',
  'attendances',
  'contents',
  'announcements',
  'media',
  'documents',
  'notifications',
  'reportrecords',
  'auditlogs',
];

const main = async (): Promise<void> => {
  await connectDatabase();
  // eslint-disable-next-line no-console
  console.log(`[diag] database=${mongoose.connection.name} uri=${env.MONGODB_URI}`);

  const db = mongoose.connection.db;
  if (!db) throw new Error('No database handle');

  const existing = new Set((await db.listCollections().toArray()).map((row) => row.name));

  for (const name of COLLECTIONS) {
    if (!existing.has(name)) {
      // eslint-disable-next-line no-console
      console.log(`[diag] ${name.padEnd(15)} missing`);
      continue;
    }
    const total = await db.collection(name).countDocuments();
    // eslint-disable-next-line no-console
    console.log(`[diag] ${name.padEnd(15)} total=${total}`);
  }

  const memberSample = await db
    .collection('members')
    .find({})
    .limit(3)
    .project({ memberId: 1, status: 1, district: 1, unit: 1, communities: 1 })
    .toArray();
  // eslint-disable-next-line no-console
  console.log('[diag] member sample', JSON.stringify(memberSample));

  await disconnectDatabase();
};

main().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('[diag] failed', error);
  await disconnectDatabase();
  process.exit(1);
});
