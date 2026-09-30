/**
 * Second pass: point every panel's cross-feature imports at the panel's OWN
 * copy of that feature, so a panel never reaches back into a sibling.
 *
 *   node tools/relink-panel.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ADMIN = path.resolve('frontend/src/fetaures/Admin');
const PANELS = ['SuperAdmin', 'DistrictAdmin', 'UnitAdmin'];
const IMPORT_RE = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.[^'"]*)\2/g;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });

/** Matches a module path the way TypeScript resolves it. */
const resolves = (base) =>
  [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].some(
    (candidate) => existsSync(candidate),
  );

let relinked = 0;
const unresolved = new Set();

for (const panel of PANELS) {
  const panelDir = path.join(ADMIN, panel);

  for (const file of walk(panelDir)) {
    const source = readFileSync(file, 'utf8');
    const updated = source.replace(IMPORT_RE, (match, prefix, quote, spec) => {
      const target = path.resolve(path.dirname(file), spec);
      const relative = path.relative(ADMIN, target).split(path.sep).join('/');

      // Already inside this panel, or outside Admin entirely (src/components,
      // ../Auth, etc.) - leave those alone.
      if (relative.startsWith('../') || relative === '' || relative.startsWith(`${panel}/`)) {
        return match;
      }

      // The layout shell (sidebar, header, search) is deliberately one shared
      // component set; only the per-panel navigation lists are duplicated.
      if (relative.startsWith('Layouts/')) return match;

      // A sibling at Admin/<Name>. Prefer the panel's own copy; if the panel
      // kept it under Shared/ instead, use that.
      const sibling = relative.split('/')[0];
      const tail = relative.slice(sibling.length + 1);
      const own =
        [path.join(ADMIN, panel, sibling, tail), path.join(ADMIN, panel, 'Shared', tail)].find(
          resolves,
        );

      if (own) {
        relinked += 1;
        const specifier = path
          .relative(path.dirname(file), own)
          .split(path.sep)
          .join('/');
        return `${prefix}${quote}${specifier.startsWith('.') ? specifier : `./${specifier}`}${quote}`;
      }

      unresolved.add(`${panel}: ${relative}`);
      return match;
    });

    if (updated !== source) writeFileSync(file, updated, 'utf8');
  }
}

console.log(`relinked ${relinked} cross-feature imports`);
if (unresolved.size) {
  console.log('\nno panel copy for:');
  for (const item of [...unresolved].sort()) console.log(`  ${item}`);
} else {
  console.log('every cross-feature import resolves inside its own panel');
}