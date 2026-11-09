// ONE-TIME: start per-record history in the private GitHub repo
// (lp-data-backups/records/, see src/lib/backup/records.js) with two commits:
//   1. every current record, except the docs in --before, which go in at their
//      BEFORE versions (+ _tables/, INDEX.md, README.md)   message: --initial-message
//   2. those docs at their current Supabase versions        message: --update-message
// so `git log -p` on those records shows the update as its own commit.
//
//   node scripts/seed-record-history.mjs --before <file.json> \
//     --initial-message "<msg>" --update-message "<msg>" [--dry-run]
//
// <file.json>: [{ id, doc }] (the docs before the update). Refuses to run if
// records/ already exists in the repo. Reads Supabase only (never writes it).
// Prints counts, paths and commit SHAs only; never a secret or a field value.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTables, readmeText } from '../src/lib/backup/export.js';
import { gitBlobSha, githubClient, githubConfig } from '../src/lib/backup/github.js';
import { RECORDS_DIR, buildRecordFiles, recordPath } from '../src/lib/backup/records.js';
import { changedKeys } from '../src/lib/backup/edit.js';
import { stageRecords, supabaseRest, verifyCommitted } from '../src/lib/backup/run.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = { dryRun: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dry-run') opt.dryRun = true;
  else if (a === '--before') opt.before = argv[++i];
  else if (a === '--initial-message') opt.initial = argv[++i];
  else if (a === '--update-message') opt.update = argv[++i];
  else throw new Error(`unknown option ${a}`);
}
if (!opt.before || !opt.initial || !opt.update) {
  console.error('usage: node scripts/seed-record-history.mjs --before <file.json> --initial-message "<msg>" --update-message "<msg>" [--dry-run]');
  process.exit(2);
}
if ([opt.initial, opt.update].some((m) => /@/.test(m))) throw new Error('commit messages must not contain an email address');

let fileEnv = {};
try {
  fileEnv = Object.fromEntries(readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
} catch {}
const env = { ...fileEnv, ...process.env };

const before = JSON.parse(readFileSync(opt.before, 'utf8'));
if (!Array.isArray(before) || !before.length) throw new Error('--before must be a non-empty array of { id, doc }');

const supabase = supabaseRest({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY });
const { rows: tables, missing } = await readTables(supabase.rest);
const rowById = new Map(tables.sanity_docs.map((r) => [r.id, r]));

// Commit 1's view of sanity_docs: the BEFORE versions swapped in.
const beforeById = new Map();
for (const { id, doc } of before) {
  const row = rowById.get(id);
  if (!row) throw new Error(`--before doc ${id} is not in sanity_docs`);
  if (doc?._id !== id || doc?._type !== row.type) throw new Error(`--before doc ${id}: _id/_type do not match the row`);
  beforeById.set(id, doc);
  const keys = changedKeys(doc, row.doc);
  console.log(`${RECORDS_DIR}/${recordPath(row.type, id)}: ${keys.length} key(s) differ between BEFORE and now${keys.length ? ` (${keys.slice(0, 12).join(', ')}${keys.length > 12 ? ', …' : ''})` : ''}`);
  if (!keys.length) throw new Error(`--before doc ${id} is identical to the current version; nothing to show in commit 2`);
}
const initialTables = { ...tables, sanity_docs: tables.sanity_docs.map((r) => (beforeById.has(r.id) ? { ...r, doc: beforeById.get(r.id) } : r)) };
const initialFiles = buildRecordFiles(initialTables);
const bytes = [...initialFiles.values()].reduce((a, c) => a + Buffer.byteLength(c), 0);
console.log(`commit 1: ${initialFiles.size} files under ${RECORDS_DIR}/ (${tables.sanity_docs.length} records, ${(bytes / 1048576).toFixed(2)} MB) + README.md${missing.length ? `; tables not present: ${missing.join(', ')}` : ''}`);

if (opt.dryRun) {
  console.log('dry run: nothing written');
  process.exit(0);
}

const drive = githubClient(githubConfig(env));
const existing = await drive.listTree(RECORDS_DIR);
if (existing.size) {
  console.error(`${RECORDS_DIR}/ already exists in the repo (${existing.size} files): the seed runs once only. Nothing was written.`);
  process.exit(1);
}

// Commit 1.
const s1 = await stageRecords(drive, initialTables);
const readme = readmeText({ target: 'github' });
const readmeSha = gitBlobSha(Buffer.from(readme, 'utf8'));
const readmeWritten = (await drive.listTree('', { recursive: false })).get('README.md')?.sha === readmeSha ? [] : [['README.md', readmeSha]];
if (readmeWritten.length) drive.stageText('README.md', readme);
const c1 = await drive.commit(opt.initial);
await verifyCommitted(drive, [...s1.written, ...readmeWritten], []);
console.log(`commit 1 ${c1.sha}: ${c1.files} files, verified`);

// Commit 2: the current versions; only the --before docs (and INDEX.md if a name changed) may differ.
const s2 = await stageRecords(drive, tables);
const allowed = new Set([...beforeById.keys()].map((id) => `${RECORDS_DIR}/${recordPath(rowById.get(id).type, id)}`));
allowed.add(`${RECORDS_DIR}/INDEX.md`);
const extra = [...s2.written.map(([p]) => p), ...s2.removed].filter((p) => !allowed.has(p));
if (extra.length) throw new Error(`commit 2 would also change ${extra.length} other path(s) (${extra.slice(0, 3).join(', ')}); stopping after commit 1`);
const c2 = await drive.commit(opt.update);
await verifyCommitted(drive, s2.written, s2.removed);
console.log(`commit 2 ${c2.sha}: ${c2.files} files (${s2.written.map(([p]) => p).join(', ')}), verified`);
