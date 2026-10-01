// Validates the deployment config files and records what each platform needs.
// Uses python3 for the YAML parse so the repo needs no extra dependency.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const report = [];
const ok = (m) => report.push(`PASS  ${m}`);
const bad = (m) => report.push(`FAIL  ${m}`);

// ---- render.yaml (parsed with PyYAML so syntax errors are caught for real) ----
try {
  const script = `
import sys, json
try:
    import yaml
except ImportError:
    print(json.dumps({"missing": True})); sys.exit(0)
with open("render.yaml", encoding="utf-8") as fh:
    doc = yaml.safe_load(fh)
print(json.dumps({"missing": False, "doc": doc}))
`;
  const raw = execFileSync('python', ['-c', script], { encoding: 'utf8' });
  const parsed = JSON.parse(raw);
  if (parsed.missing) {
    throw new Error('PyYAML not installed; cannot verify syntax');
  }
  const doc = parsed.doc;
  const svc = doc?.services?.[0];
  if (!svc) throw new Error('no services[0]');
  if (svc.rootDir !== 'backend') throw new Error(`rootDir=${svc.rootDir}`);
  if (!String(svc.buildCommand).includes('npm run build')) throw new Error('buildCommand');
  if (!String(svc.startCommand).includes('npm start')) throw new Error('startCommand');
  if (svc.healthCheckPath !== '/health') throw new Error(`healthCheckPath=${svc.healthCheckPath}`);
  const keys = svc.envVars.map((e) => e.key);
  for (const required of ['MONGODB_URI', 'CLIENT_URL', 'JWT_ACCESS_SECRET', 'NODE_ENV']) {
    if (!keys.includes(required)) throw new Error(`missing envVar ${required}`);
  }
  const secrets = svc.envVars.filter((e) => e.sync === false).map((e) => e.key);
  if (secrets.length < 3) throw new Error('expected >=3 secret envVars');
  const text = readFileSync('render.yaml', 'utf8');
  if (/mongodb:\/\/[^$\s]*:[^$\s]*@/.test(text)) throw new Error('a live Mongo URI looks committed');
  ok(`render.yaml parses; service=${svc.name}; secrets=${secrets.join(',')}`);
} catch (e) {
  bad(`render.yaml -> ${e.message}`);
}

// ---- netlify.toml ----
try {
  const raw = readFileSync('netlify.toml', 'utf8');
  if (!/\[\[redirects\]\]/.test(raw)) throw new Error('no [[redirects]] for SPA routing');
  if (!/from\s*=\s*"\/\*"/.test(raw)) throw new Error('no catch-all redirect');
  if (!/to\s*=\s*"\/index\.html"/.test(raw)) throw new Error('redirect target is not /index.html');
  if (!/publish\s*=\s*"dist"/.test(raw)) throw new Error('publish is not dist');
  if (!/base\s*=\s*"frontend"/.test(raw)) throw new Error('base is not frontend');
  // A client built without VITE_API_BASE_URL falls back to the relative "/api",
  // so every call hits the Netlify origin and the catch-all below returns
  // index.html with HTTP 200. The client parses HTML as JSON, unwrapList()
  // yields [], and the whole site looks "up but empty" - indistinguishable from
  // an unseeded database. This rule turns that into a 404. It only helps if it
  // sits ABOVE the catch-all, since Netlify stops at the first match, so the
  // ordering is checked as well as the presence.
  const apiGuard = raw.indexOf('from = "/api/*"');
  if (apiGuard === -1) throw new Error('no /api/* guard, so a missing VITE_API_BASE_URL fails silently');
  const catchAll = raw.indexOf('from = "/*"');
  if (catchAll === -1) throw new Error('no catch-all redirect');
  if (apiGuard > catchAll) {
    throw new Error('the /api/* guard is below the "/*" catch-all and will never match');
  }
  ok('netlify.toml has SPA redirect, publish=dist, base=frontend');
  ok('netlify.toml rejects /api/* above the catch-all so a missing VITE_API_BASE_URL 404s');
} catch (e) {
  bad(`netlify.toml -> ${e.message}`);
}

// ---- frontend .env.example ----
try {
  const raw = readFileSync('frontend/.env.example', 'utf8');
  if (!/VITE_API_BASE_URL/.test(raw)) throw new Error('VITE_API_BASE_URL not documented');
  ok('frontend/.env.example documents VITE_API_BASE_URL');
} catch (e) {
  bad(`frontend/.env.example -> ${e.message}`);
}

// ---- live deployment probe (opt-in) ----
// Every check above reads config files, so all of them can pass while the
// deployed sites are still broken. In this project the live Netlify build
// carried a relative "/api" and the Render hostname 404'd, and the whole
// verifier still reported green. Pass --live (plus optionally the two hostnames)
// to check what is actually being served.
//
//   node tools/verify-deploy-config.mjs --live
//   node tools/verify-deploy-config.mjs --live --api=https://x.onrender.com --site=https://y.netlify.app
if (process.argv.includes('--live')) {
  const flag = (name) => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : undefined;
  };
  const api = flag('api');
  const site = flag('site');
  const netlify = site ?? 'https://heavenlyniravanapathsunsari.netlify.app';

  if (api) {
    try {
      const res = await fetch(`${api.replace(/\/$/, '')}/health`);
      if (res.status === 404) {
        bad(`live API ${api}/health -> 404; the service is not deployed at that hostname`);
      } else {
        const body = await res.json();
        if (body.database !== 'connected') {
          bad(`live API ${api}/health -> database=${body.database}; Atlas is not connected`);
        } else {
          ok(`live API ${api}/health -> database=connected`);
        }
      }
    } catch (e) {
      bad(`live API ${api}/health -> unreachable (${e.message})`);
    }
  } else {
    bad('live API hostname not supplied; pass --api=https://<service>.onrender.com');
  }

  try {
    const html = await (await fetch(netlify)).text();
    const chunk = html.match(/href="(\/assets\/ui-[^"]+\.js)"/) ?? html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!chunk) throw new Error('could not locate the built bundle in index.html');
    const js = await (await fetch(new URL(chunk[1], netlify))).text();
    // apiClient compiles to `_r=\`<base>\``; the relative fallback means
    // VITE_API_BASE_URL was absent from the build environment.
    const match = js.match(/_r=`([^`]*)`/);
    const base = match ? match[1] : null;
    if (base && base.startsWith('http')) {
      ok(`live site points at the API (${base})`);
    } else {
      bad(
        `live site uses ${base ?? 'an unknown base URL'} instead of an absolute API origin; ` +
          'set VITE_API_BASE_URL in Netlify and redeploy',
      );
    }
  } catch (e) {
    bad(`live site ${netlify} -> ${e.message}`);
  }
}


// ---- every relative asset render must be resolved ----
// Scans all of frontend/src instead of a hardcoded list, so a future page
// cannot silently reintroduce the bug.
const ASSET_ATTR =
  /(?:src|href|srcSet)=\{(?!resolveAssetUrl)([^{}]*?\.(?:url|photo|logo|coverImage|image|file|document|src|thumbnail))\}/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

let scanned = 0;
let unresolved = 0;
for (const f of walk('frontend/src')) {
  scanned += 1;
  const raw = readFileSync(f, 'utf8');
  const hits = [...raw.matchAll(ASSET_ATTR)];
  if (hits.length) {
    unresolved += hits.length;
    bad(`${f.replace(/\\/g, '/')}: ${hits.map((h) => h[0]).join(' | ')}`);
  }
}
if (!unresolved) ok(`all ${scanned} frontend sources resolve asset URLs via resolveAssetUrl`);

// ---- external embeds must NOT be rewritten ----
try {
  const raw = readFileSync(
    'frontend/src/fetaures/Public/Layouts/components/publicSections/index.tsx',
    'utf8',
  );
  if (/resolveAssetUrl\(src\)/.test(raw)) throw new Error('iframe embed URL was wrapped');
  if (!/resolveAssetUrl\(url\)/.test(raw)) throw new Error('<video> not resolved');
  ok('VideoEmbed: external iframe src untouched, <video src> resolved');
} catch (e) {
  bad(`VideoEmbed -> ${e.message}`);
}

// ---- frontend env var name matches the code ----
try {
  const client = readFileSync('frontend/src/services/api/apiClient.ts', 'utf8');
  const http = readFileSync('frontend/src/services/api/httpClient.ts', 'utf8');
  const used = new Set([
    ...[...client.matchAll(/import\.meta\.env\.([A-Z_]+)/g)].map((m) => m[1]),
    ...[...http.matchAll(/import\.meta\.env\.([A-Z_]+)/g)].map((m) => m[1]),
  ]);
  const example = readFileSync('frontend/.env.example', 'utf8');
  for (const v of used) {
    if (!example.includes(v)) throw new Error(`${v} used in code but missing from .env.example`);
  }
  ok(`frontend env vars documented: ${[...used].join(', ')}`);
} catch (e) {
  bad(`frontend env -> ${e.message}`);
}

// ---- render.yaml must cover every required backend var ----
try {
  const src = readFileSync('backend/src/config/env.ts', 'utf8');
  const block = src.slice(src.indexOf('z.object({'), src.indexOf('.safeParse'));
  // Vars that must come from the environment rather than a default.
  const required = [...block.matchAll(/^\s*([A-Z_]+):\s*z\.string\(\)\.min/gm)].map((m) => m[1]);
  const yamlText = readFileSync('render.yaml', 'utf8');
  for (const key of required) {
    if (!new RegExp(`key:\\s*${key}\\b`).test(yamlText)) throw new Error(`render.yaml lacks ${key}`);
  }
  if (!/STORAGE_PROVIDER/.test(yamlText)) throw new Error('render.yaml lacks STORAGE_PROVIDER');
  ok(`render.yaml covers required backend vars: ${required.join(', ')}`);
} catch (e) {
  bad(`render.yaml env coverage -> ${e.message}`);
}

// Write the report only when something fails, so running this check does not
// leave a stray file in the working tree.
if (report.some((line) => line.startsWith('FAIL'))) {
  writeFileSync('deploy-report.txt', report.join('\n') + '\n');
}
// ---- list responses must never hand back undefined items ----
// Regression guard for the production homepage crash:
//   "Cannot read properties of undefined (reading 'length')"
// unwrapList() used to pass response.data.data straight through, but the error
// envelope { success:false, message, errors } has no `data` key, so items was
// undefined and every .length read in HomePage/UnitsPanel/AnnouncementsPanel
// threw, white-screening the page. Every list page reaches this through
// unwrapList, so fixing it there fixes all of them at once.
try {
  const client = readFileSync('frontend/src/services/api/apiClient.ts', 'utf8');
  const listBlock = client.slice(client.indexOf('export const unwrapList'));
  if (!/Array\.isArray\(response\.data\.data\)/.test(listBlock)) {
    throw new Error('unwrapList does not guard against a missing data array');
  }
  ok('unwrapList coerces a missing/error-envelope data key to []');
} catch (e) {
  bad(`unwrapList guard -> ${e.message}`);
}

// ---- /health must be able to explain a dead database ----
// The MONGODB_URI deploy failure was hard to read because /health returned a
// bare "ok": the process was reachable while Mongo was not. `database` is the
// field that distinguishes "API is up" from "API can serve data".
try {
  const app = readFileSync('backend/src/app.ts', 'utf8');
  if (!/database:\s*isDatabaseConnected\(\)/.test(app)) {
    throw new Error('/health does not report database connectivity');
  }
  if (!/isDatabaseConnected/.test(readFileSync('backend/src/config/database.ts', 'utf8'))) {
    throw new Error('isDatabaseConnected is missing from database.ts');
  }
  ok('/health reports database connectivity (isDatabaseConnected is wired in)');
} catch (e) {
  bad(`health check diagnostics -> ${e.message}`);
}

// ---- production must reject a localhost MONGODB_URI ----
// Guards the exact deploy failure: MONGODB_URI left at mongodb://localhost,
// which Render refuses with ECONNREFUSED 127.0.0.1:27017 and exit 1.
try {
  const envSrc = readFileSync('backend/src/config/env.ts', 'utf8');
  if (!/NODE_ENV === 'production'/.test(envSrc)) {
    throw new Error('the localhost MongoDB guard is not scoped to production');
  }
  if (!/\(localhost\|127\\\.0\\\.0\\\.1\)/.test(envSrc) && !/\(localhost\|127\./.test(envSrc)) {
    throw new Error('the localhost MongoDB guard does not match localhost/127.0.0.1');
  }
  ok('env.ts rejects a localhost MONGODB_URI in production');
} catch (e) {
  bad(`localhost MongoDB guard -> ${e.message}`);
}

console.log(report.join('\n'));
// Non-zero exit lets CI or a pre-deploy hook gate on this check.
if (report.some((line) => line.startsWith('FAIL'))) process.exitCode = 1;
