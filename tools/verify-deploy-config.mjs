// Validates the deployment config files and records what each platform needs.
// Uses python3 for the YAML parse so the repo needs no extra dependency.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

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
  ok('netlify.toml has SPA redirect, publish=dist, base=frontend');
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

// ---- every relative asset render must be resolved ----
const assetUsers = [
  'frontend/src/components/ui/FileUploader.tsx',
  'frontend/src/fetaures/Admin/SuperAdmin/Content/pages/ContentFeedPage.tsx',
  'frontend/src/fetaures/Admin/DistrictAdmin/Content/pages/ContentFeedPage.tsx',
  'frontend/src/fetaures/Admin/UnitAdmin/Content/pages/ContentFeedPage.tsx',
  'frontend/src/fetaures/Admin/SuperAdmin/Members/pages/MemberDetailsPage.tsx',
  'frontend/src/fetaures/Admin/DistrictAdmin/Members/pages/MemberDetailsPage.tsx',
  'frontend/src/fetaures/Admin/UnitAdmin/Members/pages/MemberDetailsPage.tsx',
];
let unresolved = 0;
for (const f of assetUsers) {
  const raw = readFileSync(f, 'utf8');
  const bad2 = [...raw.matchAll(/src=\{(?!resolveAssetUrl)([^{}]*?\.(?:url|photo|logo|coverImage))\}/g)];
  if (bad2.length) {
    bad(`${f}: ${bad2.length} unresolved asset src`);
    unresolved += bad2.length;
  }
}
if (!unresolved) ok('all gallery / photo / preview <img src> go through resolveAssetUrl');

writeFileSync('deploy-report.txt', report.join('\n') + '\n');
console.log(report.join('\n'));
