/**
 * Scopes every duplicated Redux action type to its panel.
 *
 * The three panels each own a copy of e.g. the `member` slice. Without this,
 * all three register the action type `member/fetchList`, so a District Admin
 * listing members would also write into the Super Admin and Unit Admin branches.
 * Prefixing the type keeps each panel's state transitions to itself.
 *
 *   node tools/prefix-actions.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ADMIN = path.resolve('frontend/src/fetaures/Admin');
const PANELS = {
  SuperAdmin: 'superAdmin',
  DistrictAdmin: 'districtAdmin',
  UnitAdmin: 'unitAdmin',
};

/** `createListSlice<Member>('member', ...)` */
const LIST_SLICE = /(createListSlice\s*(?:<[^>]*>)?\s*\(\s*)'([^']+)'/g;

/** `createSlice({ name: 'dashboard', ... })` */
const SLICE_NAME = /(createSlice\(\s*\{\s*\n\s*name:\s*)'([^']+)'/g;

/** `createAsyncThunk<...>('dashboard/load', ...)` */
const THUNK_TYPE = /(createAsyncThunk\s*(?:<[\s\S]*?>)?\s*\(\s*)'([^']+)'/g;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });

for (const [panel, prefix] of Object.entries(PANELS)) {
  let touched = 0;

  for (const file of walk(path.join(ADMIN, panel))) {
    if (!file.includes(`${path.sep}redux${path.sep}`)) continue;

    const source = readFileSync(file, 'utf8');
    const scope = (_m, head, name) =>
      name.startsWith(`${prefix}.`) ? `${head}'${name}'` : `${head}'${prefix}.${name}'`;

    const updated = source
      .replace(LIST_SLICE, scope)
      .replace(SLICE_NAME, scope)
      .replace(THUNK_TYPE, scope);

    if (updated !== source) {
      writeFileSync(file, updated, 'utf8');
      touched += 1;
    }
  }
  console.log(`${panel}: scoped action types in ${touched} redux files`);
}