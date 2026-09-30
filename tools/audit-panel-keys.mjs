// One-off audit: confirm every panel slice/thunk key is panel-namespaced and
// that no two panels share a Redux action-type prefix.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/fetaures/Admin';
const PANELS = ['SuperAdmin', 'DistrictAdmin', 'UnitAdmin'];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const byKey = new Map();

for (const panel of PANELS) {
  const files = walk(join(ROOT, panel));
  const keys = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    // createListSlice<T>('panel.feature') / createAsyncThunk<T,...>('panel.feature/load')
    for (const m of text.matchAll(/(?:createListSlice|createAsyncThunk)<[\s\S]*?>\(\s*'([^']+)'/g)) {
      keys.push(m[1]);
    }
    // createSlice({ name: 'panel.feature' })
    for (const m of text.matchAll(/createSlice\(\s*\{\s*name:\s*'([^']+)'/g)) {
      keys.push(m[1]);
    }
  }
  const unique = [...new Set(keys)].sort();
  for (const k of unique) {
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(panel);
  }
  console.log(`${panel}: ${keys.length} occurrences, ${unique.length} distinct`);
  for (const k of unique) console.log(`    ${k}`);
}

console.log('\n=== keys claimed by more than one panel ===');
const collisions = [...byKey.entries()].filter(([, panels]) => panels.length > 1);
if (collisions.length === 0) {
  console.log('NONE - every Redux key is panel-private');
} else {
  for (const [k, panels] of collisions) console.log(`  ${k} -> ${panels.join(', ')}`);
}

console.log('\n=== keys not prefixed by their own panel ===');
const bare = [...byKey.keys()].filter((k) => !/^(superAdmin|districtAdmin|unitAdmin)\./.test(k));
console.log(bare.length === 0 ? 'NONE - all keys carry a panel prefix' : bare.join('\n'));