// Full backup of the Supabase LP database (yali-lp-data) to the private GitHub
// repo (GITHUB_BACKUP_REPO, default jakradum/yali-docs, folder lp-data-backups/).
// Same code and layout as the scheduled run in /api/cron/supabase-sync
// (src/lib/backup/run.js, target 'github'), but with no time box: every bucket
// object not yet in the repo is copied, in ONE commit. Use it for the first full
// backup (too big for one 60 s cron run) or to catch up by hand.
//
//   node scripts/backup-to-github.mjs             back up
//   node scripts/backup-to-github.mjs --recheck   also download files already in the
//                                                 repo and rewrite any whose content differs
//   node scripts/backup-to-github.mjs --dry-run   read Supabase only: counts and sizes, no GitHub calls
//
// Reads SUPABASE_URL, SUPABASE_SECRET_KEY and GITHUB_BACKUP_TOKEN from the
// environment or .env.local. Prints counts, sizes and the commit SHA only;
// never a token or a row.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportTables } from '../src/lib/backup/export.js';
import { MAX_BLOB_BYTES } from '../src/lib/backup/github.js';
import { runBackup, supabaseRest } from '../src/lib/backup/run.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const unknown = [...args].filter((a) => !['--dry-run', '--recheck'].includes(a));
if (unknown.length) throw new Error(`unknown option ${unknown.join(' ')}`);

let fileEnv = {};
try {
  fileEnv = Object.fromEntries(readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
} catch {}
const env = { ...fileEnv, ...process.env };
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

if (args.has('--dry-run')) {
  const supabase = supabaseRest({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY });
  const { manifestTables, fileRows, missing } = await exportTables(supabase.rest);
  const objects = await supabase.listBucket();
  const known = new Set(fileRows.map((r) => r.storage_path));
  const total = objects.reduce((a, o) => a + (o.size || 0), 0);
  const largest = objects.reduce((a, o) => Math.max(a, o.size || 0), 0);
  const tableBytes = Object.values(manifestTables).reduce((a, t) => a + (t.bytes || 0), 0);
  console.log(`dry run: ${manifestTables.sanity_docs?.rows ?? 0} documents; tables ${Object.entries(manifestTables).map(([t, v]) => `${t}=${v.missing ? 'missing' : v.rows}`).join(' ')} (${mb(tableBytes)})`);
  console.log(`bucket: ${objects.length} objects, ${mb(total)}; largest ${mb(largest)}; over the ${mb(MAX_BLOB_BYTES)} limit: ${objects.filter((o) => o.size > MAX_BLOB_BYTES).length}; without a sanity_files row: ${objects.filter((o) => !known.has(o.path)).length}${missing.length ? `; tables not present yet: ${missing.join(', ')}` : ''}`);
  console.log(`token: GITHUB_BACKUP_TOKEN is ${env.GITHUB_BACKUP_TOKEN ? 'set' : 'NOT set'}`);
  process.exit(0);
}

if (!env.GITHUB_BACKUP_TOKEN) {
  console.error('GITHUB_BACKUP_TOKEN is not set (environment or .env.local). Nothing was written.');
  process.exit(1);
}
const r = await runBackup({
  target: 'github',
  env,
  budgetMs: Infinity,
  maxFiles: Infinity,
  recheck: args.has('--recheck'),
  by: 'scripts/backup-to-github.mjs',
});
console.log(`backup ${r.stamp}: commit ${r.commit}; tables ${Object.entries(r.tables).map(([t, n]) => `${t}=${n}`).join(' ')}`);
console.log(`files: ${r.files.total} in bucket, ${r.files.copied} copied now, ${r.files.kept} already backed up, ${r.files.pending} pending; verified ${r.verified}; ${(r.ms / 1000).toFixed(1)} s`);
