/**
 * Copies a feature folder into a panel and rewrites its relative imports.
 *
 * Every import is resolved to an absolute path against the OLD file location,
 * then re-expressed relative to the NEW location. That is exact, unlike a
 * regex that would have to guess how many levels a path escapes.
 *
 *   node tools/copy-feature.mjs <srcDir> <destDir>
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [, , srcArg, destArg] = process.argv;
if (!srcArg || !destArg) {
  console.error('usage: node tools/copy-feature.mjs <srcDir> <destDir>');
  process.exit(1);
}

const srcDir = path.resolve(srcArg);
const destDir = path.resolve(destArg);

if (!existsSync(srcDir)) {
  console.error(`source not found: ${srcDir}`);
  process.exit(1);
}

rmSync(destDir, { recursive: true, force: true });
mkdirSync(path.dirname(destDir), { recursive: true });
cpSync(srcDir, destDir, { recursive: true });

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });

const IMPORT_RE = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.[^'"]*)\2/g;

let rewritten = 0;
for (const newFile of walk(destDir)) {
  const oldFile = path.join(srcDir, path.relative(destDir, newFile));
  if (!existsSync(oldFile)) continue;

  const source = readFileSync(oldFile, 'utf8');
  const updated = source.replace(IMPORT_RE, (match, prefix, quote, spec) => {
    const oldTarget = path.resolve(path.dirname(oldFile), spec);
    let next = path.relative(path.dirname(newFile), oldTarget).split(path.sep).join('/');
    if (!next.startsWith('.')) next = `./${next}`;
    return `${prefix}${quote}${next}${quote}`;
  });

  if (updated !== source) {
    writeFileSync(newFile, updated, 'utf8');
    rewritten += 1;
  }
}

console.log(
  `${path.basename(srcDir)} -> ${destDir}  (${walk(destDir).length} files, ${rewritten} rewritten)`,
);