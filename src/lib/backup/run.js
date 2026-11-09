// One backup run of the Supabase LP database, to either target:
//   'github'   Pranav's private repo (src/lib/backup/github.js), run by
//              /api/cron/supabase-sync after the keep-alive ping. The live target.
//   'onedrive' OneDrive via Microsoft Graph (src/lib/backup/graph.js), behind
//              /api/cron/onedrive-backup. Kept working, not scheduled.
// GitHub steps: read the tables → copy bucket objects not yet backed up
// (time-boxed; the rest are `pending` and copied by the next run) → diff the
// per-record files (records.js) against the branch head by git blob SHA → ONE
// commit with only what changed (none if nothing did) → read the tree back and
// verify every changed path. A ref race re-reads Supabase and retries once.
// OneDrive steps (unchanged): one dated folder of whole tables + manifest per
// run, bucket objects, README, verify sizes.
import { Resend } from 'resend';
import { BUCKET, FILES_DIR, buildManifest, exportTables, readTables, readmeText, runStamp, sha } from './export.js';
import { BACKUP_OWNER, backupTarget, driveClient, getBackupAccessToken, graphConfig, supabaseTokenStore } from './graph.js';
import { RefRaceError, gitBlobSha, githubClient, githubConfig } from './github.js';
import { RECORDS_DIR, buildRecordFiles, diffRecordFiles, portalChangesMessage, summarize } from './records.js';

// Stop starting new file copies after this long, so the run (tables, commit,
// verify) always fits inside the function's 60 s.
export const FILE_BUDGET_MS = 30_000;
export const MAX_FILES_PER_RUN = 40;
const LIST_PAGE = 1000;

export const TARGET_ROUTE = { github: 'api/cron/supabase-sync', onedrive: 'api/cron/onedrive-backup' };

export function supabaseRest({ url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY, fetchImpl = fetch } = {}) {
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  return {
    url,
    rest: (path, extra = {}) => fetchImpl(`${url}${path}`, { headers: { ...headers, ...extra } }),
    // A write to PostgREST (lp-edit only). → parsed JSON rows (Prefer: return=representation).
    async send(method, path, body) {
      const res = await fetchImpl(`${url}${path}`, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Supabase ${method} ${path.split('?')[0]} failed: ${res.status} ${String(err?.message || '').slice(0, 200)}`.trim());
      }
      return res.status === 204 ? [] : res.json();
    },
    async download(storagePath) {
      const p = storagePath.split('/').map(encodeURIComponent).join('/');
      const res = await fetchImpl(`${url}/storage/v1/object/${BUCKET}/${p}`, { headers });
      if (!res.ok) throw new Error(`Supabase download from ${BUCKET} failed: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
    // Every object in the bucket, folders walked. → [{ path, size }] sorted by path.
    async listBucket() {
      const out = [];
      async function walk(prefix) {
        for (let offset = 0; ; offset += LIST_PAGE) {
          const res = await fetchImpl(`${url}/storage/v1/object/list/${BUCKET}`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix, limit: LIST_PAGE, offset, sortBy: { column: 'name', order: 'asc' } }),
          });
          if (!res.ok) throw new Error(`Supabase list of ${BUCKET} failed: ${res.status}`);
          const page = await res.json();
          for (const e of page) {
            const path = prefix ? `${prefix}/${e.name}` : e.name;
            if (e.id == null && !e.metadata) await walk(path); // a folder
            else out.push({ path, size: e.metadata?.size ?? null });
          }
          if (page.length < LIST_PAGE) return;
        }
      }
      await walk('');
      return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    },
  };
}

// expected: [[path relative to the listed folder, bytes, gitSha?]]
function verifyListing(listing, expected, where) {
  const bad = [];
  for (const [name, bytes, gitSha] of expected) {
    const got = listing.get(name);
    if (got === undefined) bad.push(`${name} missing`);
    else if (bytes != null && got.size !== bytes) bad.push(`${name} is ${got.size} bytes, expected ${bytes}`);
    else if (gitSha && got.sha && got.sha !== gitSha) bad.push(`${name} has blob ${got.sha}, expected ${gitSha}`);
  }
  if (bad.length) throw new Error(`Verification of ${where} failed: ${bad.slice(0, 5).join('; ')}${bad.length > 5 ? ` (+${bad.length - 5} more)` : ''}`);
}

async function oneDriveClient(env, deps, fetchImpl) {
  const target = backupTarget(env);
  const config = graphConfig(env);
  const store = deps.store || supabaseTokenStore({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY, fetchImpl });
  const token = await getBackupAccessToken({ store, target, config, fetchImpl });
  return driveClient({ token, target, fetchImpl });
}

const parentDir = (p) => p.split('/').slice(0, -1).join('/');

// Copies bucket objects not already in files/ at the right size (time-boxed:
// the rest are `pending` for the next run). → { files, copied, expected }
// files: manifest entries; expected: [[path under the root, bytes, gitSha?]] for
// every file present after the run.
async function copyBucketFiles({ drive, supabase, objects, fileRows, recheck, budgetMs, maxFiles, started, now }) {
  const isGit = drive.kind === 'github';
  const rowByPath = new Map(fileRows.map((r) => [r.storage_path, r]));
  const present = await drive.listTree(FILES_DIR);
  const files = [];
  const expected = [];
  let copied = 0;
  for (const o of objects) {
    const row = rowByPath.get(o.path);
    const entry = { path: `${FILES_DIR}/${o.path}`, asset_id: row?.asset_id ?? null, sha1: row?.sha1 ?? null, bytes: o.size ?? row?.size_bytes ?? null, state: 'kept' };
    files.push(entry);
    const have = present.get(o.path);
    const sizeOk = have && (entry.bytes == null || have.size === entry.bytes);
    if (sizeOk && !recheck) {
      if (have.sha) entry.gitSha = have.sha;
      expected.push([entry.path, have.size, entry.gitSha]);
      continue;
    }
    if (drive.maxBytes && entry.bytes > drive.maxBytes) {
      entry.state = 'too-large';
      continue;
    }
    if (copied >= maxFiles || now() - started > budgetMs) {
      entry.state = 'pending';
      continue;
    }
    const buf = await supabase.download(o.path);
    if (entry.sha1 && sha('sha1', buf) !== entry.sha1) throw new Error(`Bucket file ${entry.path} failed its SHA-1 check`);
    if (o.size != null && buf.length !== o.size) throw new Error(`Bucket file ${entry.path} downloaded as ${buf.length} bytes, listed as ${o.size}`);
    const gitSha = gitBlobSha(buf);
    if (isGit) entry.gitSha = gitSha;
    entry.bytes = buf.length;
    if (sizeOk && have.sha === gitSha) {
      // recheck: same content already backed up
      expected.push([entry.path, buf.length, gitSha]);
      continue;
    }
    await drive.ensureFolder?.(parentDir(entry.path));
    const size = await drive.upload(entry.path, buf);
    if (size !== buf.length) throw new Error(`Upload of ${entry.path} returned ${size} bytes, expected ${buf.length}`);
    entry.state = 'copied';
    copied++;
    expected.push([entry.path, buf.length, isGit ? gitSha : undefined]);
  }
  const pending = files.filter((f) => f.state === 'pending').length;
  if (pending && copied === 0) throw new Error(`No new bucket file could be copied this run (${pending} pending); the time budget ran out before the first copy`);
  return { files, copied, expected };
}

function tooLargeError(drive, files, commitSha) {
  const tooLarge = files.filter((f) => f.state === 'too-large');
  if (!tooLarge.length) return null;
  const list = tooLarge.map((f) => `${f.path} (${(f.bytes / 1048576).toFixed(1)} MB)`).join(', ');
  return new Error(`${tooLarge.length} bucket file(s) over the ${drive.maxBytes / 1048576} MB limit were NOT backed up: ${list}. Tables and other files were backed up${commitSha ? ` in ${commitSha}` : ''}.`);
}

const fileCounts = (files, copied) => {
  const pending = files.filter((f) => f.state === 'pending').length;
  return { total: files.length, kept: files.length - copied - pending, copied, pending };
};

// Reads back the committed tree and checks every path this commit wrote (git
// blob SHA) or removed (absent). → true or throws.
export async function verifyCommitted(drive, written, removed = []) {
  const listing = await drive.listTree('');
  const bad = [];
  for (const [rel, sha] of written) {
    const got = listing.get(rel);
    if (!got) bad.push(`${rel} missing`);
    else if (got.sha !== sha) bad.push(`${rel} has blob ${got.sha}, expected ${sha}`);
  }
  for (const rel of removed) if (listing.has(rel)) bad.push(`${rel} still present`);
  if (bad.length) throw new Error(`Verification of the commit failed: ${bad.slice(0, 5).join('; ')}${bad.length > 5 ? ` (+${bad.length - 5} more)` : ''}`);
  return true;
}

// Stages records/ so the repo matches `tables`, for the next commit.
// → { written: [[path under root, sha]], removed: [path under root], sum }
export async function stageRecords(drive, tables) {
  const listing = await drive.listTree(RECORDS_DIR);
  const diff = diffRecordFiles(buildRecordFiles(tables), listing);
  for (const [rel, content] of diff.write) drive.stageText(`${RECORDS_DIR}/${rel}`, content);
  for (const rel of diff.remove) drive.stageRemove(`${RECORDS_DIR}/${rel}`);
  return {
    written: diff.write.map(([rel, , s]) => [`${RECORDS_DIR}/${rel}`, s]),
    removed: diff.remove.map((rel) => `${RECORDS_DIR}/${rel}`),
    sum: summarize(diff, listing),
  };
}

// Stages README.md if it differs. → [[path, sha]] (empty when unchanged)
async function stageReadme(drive) {
  const text = readmeText({ target: 'github' });
  const s = gitBlobSha(Buffer.from(text, 'utf8'));
  if ((await drive.listTree('', { recursive: false })).get('README.md')?.sha === s) return [];
  drive.stageText('README.md', text);
  return [['README.md', s]];
}

function runMessage(sum, newFiles) {
  if (sum.records || sum.tables.length || sum.index) return portalChangesMessage(sum, { newFiles });
  if (newFiles) return `backup: ${newFiles} new bucket file${newFiles === 1 ? '' : 's'}`;
  return 'backup: README';
}

// GitHub: commit only what changed since the branch head, per record.
async function runRecordBackup({ drive, supabase, deps, env, started, now, budgetMs, maxFiles }) {
  let { rows: tables } = await readTables(supabase.rest);
  const objects = await supabase.listBucket();
  const bucket = await copyBucketFiles({ drive, supabase, objects, fileRows: tables.sanity_files || [], recheck: deps.recheck, budgetMs, maxFiles, started, now });
  const newFiles = bucket.files.filter((f) => f.state === 'copied').map((f) => [f.path, f.gitSha]);

  let staged;
  let committed = null;
  for (let attempt = 0; ; attempt++) {
    if (attempt) {
      // the branch moved: read Supabase again and diff against the new head
      drive.unstageText();
      ({ rows: tables } = await readTables(supabase.rest));
    }
    staged = await stageRecords(drive, tables);
    staged.readme = await stageReadme(drive);
    if (!drive.staged.size) break;
    try {
      committed = await drive.commit(runMessage(staged.sum, bucket.copied));
      break;
    } catch (err) {
      if (!(err instanceof RefRaceError) || attempt) throw err;
    }
  }

  const written = committed?.sha ? [...staged.written, ...staged.readme, ...newFiles] : [];
  const verified = committed?.sha ? await verifyCommitted(drive, written, staged.removed) : true;
  const tooBig = tooLargeError(drive, bucket.files, committed?.sha);
  if (tooBig) throw tooBig;

  return {
    ok: true,
    complete: bucket.files.every((f) => f.state !== 'pending'),
    target: 'github',
    commit: committed?.sha ?? null,
    changed: committed?.sha ? written.length + staged.removed.length : 0,
    records: committed?.sha ? { added: staged.sum.added, changed: staged.sum.changed, removed: staged.sum.removed, byType: staged.sum.byType } : { added: 0, changed: 0, removed: 0, byType: {} },
    tables: Object.fromEntries(Object.entries(tables).map(([t, rows]) => [t, rows.length])),
    files: fileCounts(bucket.files, bucket.copied),
    verified,
    ms: now() - started,
  };
}

/**
 * deps (all optional, for tests and the script):
 *   { target: 'github' | 'onedrive', env, fetchImpl, now, store, supabase, drive,
 *     budgetMs, maxFiles, recheck, by }
 * recheck: also download files already backed up at the right size and rewrite
 * them only if their content differs (GitHub: compared by git blob SHA).
 * GitHub → { ok, complete, target, commit, changed, records, tables, files, verified, ms }
 *   (commit null and changed 0 when nothing changed: no commit is made)
 * OneDrive → { ok, complete, stamp, target, commit, tables, files: { total, kept, copied, pending }, verified, ms }
 * Throws NotConfiguredError / NotConnectedError before touching anything when not set up.
 */
export async function runBackup(deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetchImpl || fetch;
  const now = deps.now || Date.now;
  const started = now();
  const target = deps.target || 'onedrive';
  if (!TARGET_ROUTE[target]) throw new Error(`unknown backup target ${target}`);
  const budgetMs = deps.budgetMs ?? (Number(env.BACKUP_FILE_BUDGET_MS) || FILE_BUDGET_MS);
  const maxFiles = deps.maxFiles ?? MAX_FILES_PER_RUN;

  const drive = deps.drive || (target === 'github' ? githubClient({ ...githubConfig(env), fetchImpl }) : await oneDriveClient(env, deps, fetchImpl));
  const supabase = deps.supabase || supabaseRest({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY, fetchImpl });
  if (drive.kind === 'github') return runRecordBackup({ drive, supabase, deps, env, started, now, budgetMs, maxFiles });

  // OneDrive: one dated folder of whole tables per run.
  const stamp = runStamp(new Date(started));
  const { tableFiles, manifestTables, typeCounts, fileRows } = await exportTables(supabase.rest);
  const objects = await supabase.listBucket();
  const expected = []; // [path under the backup root, bytes]

  // 1. Dated folder with the table files.
  await drive.ensureFolder?.(stamp);
  for (const [name, buf] of Object.entries(tableFiles)) {
    await drive.upload(`${stamp}/${name}`, buf);
    expected.push([`${stamp}/${name}`, buf.length]);
  }

  // 2. Bucket objects.
  const bucket = await copyBucketFiles({ drive, supabase, objects, fileRows, recheck: deps.recheck, budgetMs, maxFiles, started, now });
  expected.push(...bucket.expected);

  // 3. Manifest + README.
  const manifest = buildManifest({
    createdAt: new Date(started).toISOString(),
    source: supabase.url.replace(/^https:\/\//, ''),
    stamp,
    by: deps.by || TARGET_ROUTE[target],
    tables: manifestTables,
    typeCounts,
    files: bucket.files,
  });
  const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const readmeBuf = Buffer.from(readmeText({ target }), 'utf8');
  await drive.upload(`${stamp}/manifest.json`, manifestBuf);
  await drive.upload('README.md', readmeBuf);
  expected.push([`${stamp}/manifest.json`, manifestBuf.length], ['README.md', readmeBuf.length]);

  // 4. Read back and verify every file of this run, every file kept from earlier runs, and the README.
  const under = (dir) => expected.filter(([p]) => p.startsWith(`${dir}/`)).map(([p, ...rest]) => [p.slice(dir.length + 1), ...rest]);
  verifyListing(await drive.listTree(stamp), under(stamp), `run folder ${stamp}`);
  verifyListing(await drive.listTree(FILES_DIR), under(FILES_DIR), `${FILES_DIR}/`);
  verifyListing(await drive.listTree('', { recursive: false }), expected.filter(([p]) => !p.includes('/')), 'backup root');

  const tooBig = tooLargeError(drive, bucket.files, null);
  if (tooBig) throw tooBig;

  return {
    ok: true,
    complete: bucket.files.every((f) => f.state !== 'pending'),
    stamp,
    target,
    commit: null,
    tables: Object.fromEntries(Object.entries(manifestTables).map(([t, v]) => [t, v.missing ? 'missing' : v.rows])),
    files: fileCounts(bucket.files, bucket.copied),
    verified: true,
    ms: now() - started,
  };
}

// Failure alert: the error message only, never data.
export async function notifyFailure(message, { env = process.env, resend, target = 'onedrive' } = {}) {
  const tag = `[${target}-backup]`;
  const key = env.RESEND_API_KEY;
  if (!key && !resend) {
    console.error(`${tag} RESEND_API_KEY missing; could not send the failure email`);
    return false;
  }
  const client = resend || new Resend(key);
  const where = target === 'github'
    ? 'See the Vercel logs for /api/cron/supabase-sync. Full manual run: node scripts/backup-to-github.mjs'
    : 'See the Vercel logs for /api/cron/onedrive-backup. Manual fallback: node scripts/backup-supabase-to-onedrive.mjs';
  const text = `The Yali LP data backup to ${target === 'github' ? 'GitHub' : 'OneDrive'} failed at ${new Date().toISOString()}.\n\nError: ${String(message).slice(0, 500)}\n\n${where}`;
  const { error } = await client.emails.send({
    from: 'Yali Partners <noreply@yali.vc>',
    to: BACKUP_OWNER,
    subject: 'Yali LP data backup failed',
    text,
  });
  if (error) {
    console.error(`${tag} failure email not sent:`, error.message || error.name);
    return false;
  }
  return true;
}
