/**
 * Gives every panel a private copy of the low-level API clients it needs.
 *
 * These are plain fetch wrappers (organizations, media uploads, document
 * uploads). They are duplicated rather than shared so that editing one panel's
 * request handling can never change another panel's behaviour.
 *
 *   node tools/seed-shared.mjs
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ADMIN = path.resolve('frontend/src/fetaures/Admin');

/** panels that need the API clients, and where each one lives today */
const CLIENTS = [
  { from: 'Organization/services/organizationService.ts', to: 'services/organizationService.ts' },
  { from: 'Media/services/mediaService.ts', to: 'services/mediaService.ts' },
  { from: 'Documents/services/documentService.ts', to: 'services/documentService.ts' },
];

/** every admin panel keeps its own copy of these clients */
const NEEDS = {
  SuperAdmin: true,
  DistrictAdmin: true,
  UnitAdmin: true,
};

const IMPORT_RE = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.[^'"]*)\2/g;
const walk = (dir) => readFileSync(dir, 'utf8');

for (const [panel, needed] of Object.entries(NEEDS)) {
  if (!needed) continue;

  for (const client of CLIENTS) {
    const source = path.join(ADMIN, client.from);
    const dest = path.join(ADMIN, panel, 'Shared', client.to);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(source, dest);

    // The client now sits one directory deeper, so fix its own relative imports.
    const rewritten = walk(dest).replace(IMPORT_RE, (match, prefix, quote, spec) => {
      const target = path.resolve(path.dirname(source), spec);
      let next = path
        .relative(path.dirname(dest), target)
        .split(path.sep)
        .join('/');
      if (!next.startsWith('.')) next = `./${next}`;
      return `${prefix}${quote}${next}${quote}`;
    });
    writeFileSync(dest, rewritten, 'utf8');
  }

  console.log(`${panel}: seeded ${CLIENTS.length} API clients into Shared/services`);
}
