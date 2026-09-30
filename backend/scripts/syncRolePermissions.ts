/**
 * Re-syncs the permission list of every system role with the default matrix in
 * `src/constants/rolePermissions.ts`.
 *
 * The regular seed only ever ADDS permissions (`$addToSet`) so that manual
 * customisations survive. That is the right default, but it also means a
 * permission that is removed from the matrix keeps living in the database — a
 * stale grant that the code no longer considers valid.
 *
 * Usage:
 *   npm run sync:roles            # dry run, prints the diff
 *   npm run sync:roles -- --apply # writes the matrix to the database
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { RoleModel } from '../src/modules/roles/role.model';
import { ROLE_NAMES } from '../src/constants/roles';
import { ROLE_PERMISSIONS } from '../src/constants/rolePermissions';

const apply = process.argv.includes('--apply');

const main = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
  let added = 0;
  let removed = 0;

  for (const name of Object.values(ROLE_NAMES)) {
    const expected = ROLE_PERMISSIONS[name];
    const role = await RoleModel.findOne({ name });
    if (!role) {
      console.log(`${name}: not seeded yet, run "npm run seed" first`);
      continue;
    }
    const current = new Set<string>(role.permissions as string[]);
    const granted = new Set<string>(expected);
    const toAdd = expected.filter((key) => !current.has(key));
    const toRemove = [...current].filter((key) => !granted.has(key));
    if (toAdd.length === 0 && toRemove.length === 0) continue;

    added += toAdd.length;
    removed += toRemove.length;
    console.log(`${name}: +${toAdd.length} / -${toRemove.length}`);
    for (const key of toRemove) console.log(`  - ${key}`);
    for (const key of toAdd) console.log(`  + ${key}`);

    if (apply) await RoleModel.updateOne({ name }, { $set: { permissions: expected } });
  }

  console.log(
    apply
      ? `[sync] applied: +${added} / -${removed} permissions across the system roles`
      : `[sync] dry run: +${added} / -${removed} would change — re-run with --apply to write`,
  );
  await mongoose.disconnect();
};

void main();
