/**
 * Namespaces each panel's Redux state.
 *
 * The three panels now own private copies of the same features, so `state.members`
 * would be ambiguous. Every panel gets its own branch of the store and each
 * selector reads from its own branch.
 *
 *   node tools/namespace-state.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ADMIN = path.resolve('frontend/src/fetaures/Admin');

/** panel folder -> store branch name */
const PANELS = {
  SuperAdmin: 'superAdmin',
  DistrictAdmin: 'districtAdmin',
  UnitAdmin: 'unitAdmin',
};

/** Store keys a panel may claim. */
const KEYS = [
  'organization',
  'district',
  'units',
  'communities',
  'members',
  'committees',
  'events',
  'attendance',
  'content',
  'announcements',
  'media',
  'documents',
  'reports',
  'administrators',
  'auditLogs',
  'dashboard',
];

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });

for (const [panel, branch] of Object.entries(PANELS)) {
  const dir = path.join(ADMIN, panel);
  const pattern = new RegExp(`\\bstate\\.(${KEYS.join('|')})\\b`, 'g');
  let touched = 0;

  for (const file of walk(dir)) {
    const source = readFileSync(file, 'utf8');
    const updated = source.replace(pattern, (_m, key) => `state.${branch}.${key}`);
    if (updated !== source) {
      writeFileSync(file, updated, 'utf8');
      touched += 1;
    }
  }
  console.log(`${panel}: namespaced ${touched} files under state.${branch}`);
}