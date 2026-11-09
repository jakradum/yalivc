// Edit LP records in Supabase and record the edit in the private GitHub repo
// (GITHUB_BACKUP_REPO, default jakradum/yali-docs, lp-data-backups/records/)
// as its own commit. For the Coordinator (Claude); see src/lib/backup/edit.js.
//
//   node scripts/lp-edit.mjs --message "<why>" --edits <file.mjs> [--dry-run]
//
// <file.mjs> exports `async function edit(api)`:
//   api.getDocs(filter)  copies of the current docs; filter: 'type' |
//                        { type, id, ids, where: (doc) => bool } | (doc) => bool
//   api.getDoc(id)       a copy of one doc, or null
// It mutates the copies and returns the changed docs, or
// { changed: [docs], deleted: [ids] }. New docs need _id and _type.
//
// Order: (1) any drift between Supabase and GitHub is committed first as
// `portal changes: …`; (2) the changed docs are saved to sanity_docs (new _rev,
// _updatedAt; compare-and-swap on rev); (3) exactly those record files are
// committed with the message + "Edited by Claude for Pranav"; (4) both sides are
// read back and compared. --dry-run prints the record paths and changed keys
// (never values) and writes nothing.
//
// Reads SUPABASE_URL, SUPABASE_SECRET_KEY, GITHUB_BACKUP_TOKEN from the
// environment or .env.local. Never prints a secret or a field value.
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runEdit } from '../src/lib/backup/edit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = { dryRun: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dry-run') opt.dryRun = true;
  else if (a === '--message') opt.message = argv[++i];
  else if (a === '--edits') opt.edits = argv[++i];
  else throw new Error(`unknown option ${a}`);
}
if (!opt.message || !opt.edits) {
  console.error('usage: node scripts/lp-edit.mjs --message "<why>" --edits <file.mjs> [--dry-run]');
  process.exit(2);
}

let fileEnv = {};
try {
  fileEnv = Object.fromEntries(readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
} catch {}
const env = { ...fileEnv, ...process.env };
for (const k of ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'GITHUB_BACKUP_TOKEN']) {
  if (!env[k]) { console.error(`${k} is not set (environment or .env.local). Nothing was written.`); process.exit(1); }
}

const mod = await import(pathToFileURL(resolve(opt.edits)).href);
try {
  const r = await runEdit({ env, message: opt.message, edit: mod.edit, dryRun: opt.dryRun });
  console.log(r.dryRun
    ? `dry run: ${r.edits.length} record(s) would change; nothing written`
    : `done: drift commit ${r.drift.commit || 'none'}, edit commit ${r.commit || 'none'}, verified ${r.verified}`);
} catch (err) {
  console.error(`lp-edit failed: ${err.message}`);
  process.exit(1);
}
