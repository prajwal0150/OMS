/**
 * Diagnoses a hosted MONGODB_URI without ever printing the password.
 *
 *   PowerShell:
 *     $env:MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/hps_oms'
 *     npm run check:db
 *
 * Why this exists: a Render deploy that fails with `bad auth : Authentication
 * failed` (AtlasError 8000) or `ECONNREFUSED 127.0.0.1:27017` gives no hint about
 * which of several unrelated mistakes produced it. This separates them, and lets
 * the exact string Render holds be verified from a laptop before redeploying.
 *
 * The URI is read from the environment only, never written to disk, and every
 * printed line is redacted, so the output is safe to share. Do NOT paste the
 * credential itself into a chat to ask for help - paste this script's output.
 */
import mongoose from 'mongoose';

/* eslint-disable no-console */

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is not set. Example (PowerShell):');
  console.error("  $env:MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/hps_oms'");
  process.exit(1);
}

// Anything that reaches Atlas is a credential, so redact before printing. Error
// messages from the driver can embed the connection string, hence redaction on
// the failure path too.
const redact = (value: string): string =>
  value.replace(/\/\/([^:@/]+):([^@]*)@/, (_m, user) => `//${user}:***@`);

console.log('URI      :', redact(uri));

// mongodb+srv is not a scheme `new URL` understands, so normalise it purely to
// inspect the shape of the string. Nothing connects based on this.
let parsed: URL;
try {
  parsed = new URL(uri.replace('mongodb+srv://', 'mongodb://'));
} catch {
  console.error('FAIL     : the URI is not parseable - check for a stray quote or newline.');
  process.exit(1);
}

console.log('scheme   :', uri.startsWith('mongodb+srv://') ? 'mongodb+srv' : parsed.protocol);
console.log('host     :', parsed.hostname);
console.log('database :', parsed.pathname.replace('/', '') || '(none - defaults to "test")');

// ---- structural checks that need no network round trip ----
if (/^mongodb(\+srv)?:\/\/(localhost|127\.0\.0\.1)/.test(uri)) {
  console.error('');
  console.error('FAIL     : MONGODB_URI points at localhost, which has no MongoDB.');
  console.error('           On Render this is exactly the ECONNREFUSED 127.0.0.1:27017');
  console.error('           failure. Use a hosted URI.');
  process.exit(1);
}

if (uri.includes('••••••••••') || uri.includes('<password>')) {
  console.error('');
  console.error('FAIL     : the password is still a placeholder. Atlas hands out a masked');
  console.error('           driver string; the real password must be substituted by hand.');
  process.exit(1);
}

// A password containing a reserved character must be percent-encoded or the
// driver truncates the URI and fails with a misleading "bad auth".
const userinfo = uri.slice(uri.indexOf('//') + 2, uri.indexOf('@'));
const password = userinfo.slice(userinfo.indexOf(':') + 1);
const reserved = /[@:/#?]/.exec(password);
if (reserved) {
  console.error('');
  console.error('WARN     : the password contains a reserved character:', reserved[0]);
  console.error('           Percent-encode it (%40 @, %3A :, %2F /, %23 #, %3F ?) or use a');
  console.error('           password made only of letters, digits, _ and - .');
}

if (!parsed.pathname.replace('/', '')) {
  console.error('');
  console.error('WARN     : no database name. The app will use "test".');
  console.error('           Add /hps_oms after the hostname.');
}

// Wrapped in an async main() because tsx compiles this package to CommonJS,
// where top-level await is a syntax error.
const main = async (): Promise<void> => {
  // ---- live reachability and auth, with a bounded timeout ----
  console.log('');
  console.log('connecting (10s timeout)...');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('RESULT   : CONNECTED to database "' + mongoose.connection.name + '"');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    const err = error as { codeName?: string; code?: number; message?: string };
    const message = err.message ?? String(error);

    console.error('');
    console.error('RESULT   : FAILED ->', redact(message));
    console.error('code     :', err.codeName ?? '(none)', err.code ?? '');

    if (err.code === 8000 || /bad auth/i.test(message)) {
      console.error('');
      console.error('Diagnosis: Atlas REACHED the cluster and rejected the credentials, so the');
      console.error('          hostname, scheme, network allowlist and URI format are all fine.');
      console.error('          Do not change those. Check, in Atlas -> Database Access:');
      console.error('            1. the username matches character for character (a typo in the');
      console.error('               username fails exactly like a wrong password)');
      console.error('            2. the password is the CURRENT one, not one already rotated out');
      console.error('            3. the user is not suspended and has a role on this cluster');
      console.error('               (readWriteAnyDatabase, or readWrite on hps_oms)');
    } else if (/ENOTFOUND|EAI_AGAIN/.test(message)) {
      console.error('');
      console.error('Diagnosis: the cluster hostname does not resolve. Check for typos, and');
      console.error('          that the cluster has not been deleted.');
    } else if (/timed out|Server selection/i.test(message)) {
      console.error('');
      console.error('Diagnosis: the cluster did not answer. In Atlas add 0.0.0.0/0 to');
      console.error('          Network Access -> IP Access List, and confirm the cluster is');
      console.error('          not paused.');
    }

    process.exit(1);
  }
};

void main();