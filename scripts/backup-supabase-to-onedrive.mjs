// Manual fallback for the OneDrive backup of the Supabase LP database
// (yali-lp-data). The scheduled backup is /api/cron/onedrive-backup; this
// script writes the same layout (src/lib/backup/export.js) to a local folder
// that the OneDrive app syncs to the cloud.
//
//   node scripts/backup-supabase-to-onedrive.mjs
//   BACKUP_DIR=/some/folder node scripts/backup-supabase-to-onedrive.mjs
//
// Each run writes a dated folder with every row exactly as stored, plus a
// manifest with counts and fingerprints. PDFs from the private bucket go to a
// shared files/ folder (copied once, checked against their SHA-1). Nothing is
// printed except counts. Reads SUPABASE_URL and SUPABASE_SECRET_KEY from
// .env.local. Restore: see the README.md written into the backup folder.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { BUCKET, FILES_DIR, buildManifest, exportTables, readmeText, runStamp, sha } from '../src/lib/backup/export.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = process.env.BACKUP_DIR || join(homedir(), 'Library/CloudStorage/OneDrive-YaliPartnersLLP/Yali LP Data Backups');

const env = Object.fromEntries(readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const URL_ = process.env.SUPABASE_URL || env.SUPABASE_URL, KEY = process.env.SUPABASE_SECRET_KEY || env.SUPABASE_SECRET_KEY;
if (!URL_ || !KEY) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be in .env.local');
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const rest = (path, extra = {}) => fetch(`${URL_}${path}`, { headers: { ...headers, ...extra } });

const started = new Date();
const stamp = runStamp(started);
const runDir = join(DEST, stamp);
const filesDir = join(DEST, FILES_DIR);
mkdirSync(runDir, { recursive: true });
mkdirSync(filesDir, { recursive: true });

const { tableFiles, manifestTables, typeCounts, fileRows, missing } = await exportTables(rest);
for (const [name, buf] of Object.entries(tableFiles)) writeFileSync(join(runDir, name), buf);

const files = [];
for (const f of fileRows) {
  const out = join(filesDir, f.storage_path);
  let state = 'kept';
  if (!existsSync(out)) {
    const p = f.storage_path.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${p}`, { headers });
    if (!res.ok) throw new Error(`file ${f.asset_id}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (f.sha1 && sha('sha1', buf) !== f.sha1) throw new Error(`file ${f.asset_id}: SHA-1 mismatch`);
    writeFileSync(out, buf);
    state = 'copied';
  }
  files.push({ asset_id: f.asset_id, path: `${FILES_DIR}/${f.storage_path}`, sha1: f.sha1, bytes: f.size_bytes, state });
}

const manifest = buildManifest({
  createdAt: started.toISOString(),
  source: URL_.replace(/^https:\/\//, ''),
  stamp,
  by: 'scripts/backup-supabase-to-onedrive.mjs',
  tables: manifestTables,
  typeCounts,
  files,
});
writeFileSync(join(runDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(DEST, 'README.md'), readmeText());

const docs = manifestTables.sanity_docs.rows, copied = files.filter((f) => f.state === 'copied').length;
console.log(`backup ${stamp}: ${docs} documents, ${files.length} PDFs (${copied} newly copied)${missing.length ? `; tables not present yet: ${missing.join(', ')}` : ''}`);
