// Shared backup format for the backups of the Supabase LP database
// (yali-lp-data). Used by the server job (src/lib/backup/run.js: OneDrive via
// /api/cron/onedrive-backup, GitHub via /api/cron/supabase-sync), by the manual
// OneDrive fallback (scripts/backup-supabase-to-onedrive.mjs) and by the full
// GitHub push (scripts/backup-to-github.mjs), so all write the same layout:
//
//   <root>/README.md                    restore steps
//   <root>/files/<storage path>         every object in the storage bucket, copied once
//   <root>/<UTC stamp>/<table>.jsonl    one row per line, exactly as stored
//   <root>/<UTC stamp>/manifest.json    row counts, per-type doc counts, SHA-256 per table file, file list
//
// Plain ESM with no path aliases or dependencies, so the scripts can import it.
import { createHash } from 'node:crypto';

// table → primary key (used for stable paging order and in the restore steps).
// ms_graph_tokens is deliberately absent: a backup must never hold the
// Microsoft refresh token.
export const BACKUP_TABLES = {
  sanity_docs: 'id',
  sanity_files: 'asset_id',
  sync_runs: 'id',
  sync_types: 'type',
  parity_diffs: 'id',
};
export const NEVER_BACKED_UP = ['ms_graph_tokens'];
export const BUCKET = 'sanity-files';
export const PAGE = 1000;
export const FILES_DIR = 'files';

export const sha = (alg, buf) => createHash(alg).update(buf).digest('hex');

// 2026-11-06T06-30 (UTC, minute resolution; colons are not allowed in OneDrive names)
export const runStamp = (d = new Date()) => d.toISOString().replace(/:/g, '-').slice(0, 16);

export class MissingTableError extends Error {}

// Every row of a table, paged past PostgREST's 1,000-row cap. `rest(path, headers)`
// returns a fetch Response for `${SUPABASE_URL}${path}` with the secret key.
export async function allRows(rest, table) {
  const pk = BACKUP_TABLES[table];
  if (!pk) throw new Error(`${table} is not a backup table`);
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const res = await rest(`/rest/v1/${table}?select=*&order=${pk}`, {
      Range: `${from}-${from + PAGE - 1}`,
      'Range-Unit': 'items',
    });
    if (res.status === 404) {
      const body = await res.json().catch(() => ({}));
      // PGRST205: table not in the schema cache (e.g. a later migration not applied yet).
      if (body?.code === 'PGRST205') throw new MissingTableError(`${table} does not exist`);
    }
    // 416: this page starts past the last row (row count is a multiple of PAGE).
    if (res.status === 416 && from > 0) return rows;
    if (!res.ok) throw new Error(`Supabase read ${table} failed: ${res.status}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

// One line per row; an empty table is an empty file, so line count == row count.
export const toJsonl = (rows) => (rows.length ? rows.map((r) => JSON.stringify(r)).join('\n') + '\n' : '');

// Reads every backup table. → { tableFiles: { name: Buffer }, manifestTables, typeCounts, fileRows, missing }
export async function exportTables(rest) {
  const tableFiles = {};
  const manifestTables = {};
  const typeCounts = {};
  const missing = [];
  let fileRows = [];
  for (const table of Object.keys(BACKUP_TABLES)) {
    if (NEVER_BACKED_UP.includes(table)) throw new Error(`refusing to back up ${table}`);
    let rows;
    try {
      rows = await allRows(rest, table);
    } catch (err) {
      if (err instanceof MissingTableError) {
        missing.push(table);
        manifestTables[table] = { missing: true };
        continue;
      }
      throw err;
    }
    const body = Buffer.from(toJsonl(rows), 'utf8');
    tableFiles[`${table}.jsonl`] = body;
    manifestTables[table] = { rows: rows.length, bytes: body.length, sha256: sha('sha256', body) };
    if (table === 'sanity_docs') for (const r of rows) typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    if (table === 'sanity_files') fileRows = rows;
  }
  return { tableFiles, manifestTables, typeCounts, fileRows, missing };
}

// files: [{ path, asset_id, sha1, bytes, gitSha?, state: 'kept' | 'copied' | 'pending' | 'too-large' }]
// (asset_id and sha1 are null for bucket objects without a sanity_files row)
export function buildManifest({ createdAt, source, stamp, tables, typeCounts, files, by }) {
  const pending = files.filter((f) => f.state === 'pending').length;
  const tooLarge = files.filter((f) => f.state === 'too-large').length;
  return {
    createdAt,
    source,
    stamp,
    by,
    complete: pending === 0 && tooLarge === 0,
    pendingFiles: pending,
    ...(tooLarge ? { tooLargeFiles: tooLarge } : {}),
    tables,
    typeCounts,
    files,
  };
}

const RESTORE_TABLES = () => Object.entries(BACKUP_TABLES).map(([t, k]) => `\`${t}.${k}\``).join(', ');

const README_INTRO = `# Yali LP data backups

Private backups of the Supabase project \`yali-lp-data\` (the LP portal and data room data). **Do not share this folder.** It holds the LP list, fund numbers and report PDFs.

- One folder per run, named by UTC time. Each holds one \`.jsonl\` file per table (one row per line, exactly as stored) and \`manifest.json\` (row counts, document counts per type, SHA-256 of each table file, the file list).
- \`files/\` holds every object of the private \`${BUCKET}\` storage bucket (including \`archive/\`) under its storage path, copied once. Files with a \`sanity_files\` row are checked against its SHA-1 when copied.
- A run with \`"complete": false\` in its manifest stopped before copying every new file (it ran out of time); the files marked \`pending\` are copied by the next run. The table files of every run are always complete.
- The Microsoft sign-in token (\`ms_graph_tokens\`) is never backed up.`;

export function readmeText({ target = 'onedrive' } = {}) {
  if (target === 'github') {
    return `${README_INTRO}
- Made twice a week by \`/api/cron/supabase-sync\` in the yali-site repo, right after the Supabase keep-alive ping, as one commit per run. Full push without a time limit: \`node scripts/backup-to-github.mjs\`. After each commit the job reads the tree back and checks every file's size and git blob SHA.

## Restore

1. Clone this private repo (or download it) and pick a run folder in \`lp-data-backups/\`. Check it is complete: row counts in \`manifest.json\` match the lines in each \`.jsonl\`, and each file's SHA-256 matches (\`shasum -a 256 <file>\`).
2. For each table, upsert every line back with the Supabase secret key (PostgREST \`POST /rest/v1/<table>?on_conflict=<key>\` with \`Prefer: resolution=merge-duplicates\`); keys: ${RESTORE_TABLES()}. A table marked \`"missing": true\` did not exist yet when the backup ran.
3. Upload each file in \`files/\` to the \`${BUCKET}\` bucket under the same path (\`files/archive/x.pdf\` goes back to \`archive/x.pdf\`).
`;
  }
  return `${README_INTRO} After a restore, reconnect at https://team.yali.vc/api/backup-connect.
- Made twice a week by \`/api/cron/onedrive-backup\` in the yali-site repo (manual fallback: \`scripts/backup-supabase-to-onedrive.mjs\`).

## Restore

1. Check the run is complete: row counts in \`manifest.json\` match the lines in each \`.jsonl\`, and each file's SHA-256 matches.
2. For each table, upsert every line back with the Supabase secret key (PostgREST \`POST /rest/v1/<table>?on_conflict=<key>\` with \`Prefer: resolution=merge-duplicates\`); keys: ${RESTORE_TABLES()}. A table marked \`"missing": true\` did not exist yet when the backup ran.
3. Upload each file in \`files/\` to the \`${BUCKET}\` bucket under the same path.
`;
}
