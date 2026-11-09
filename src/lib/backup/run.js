// One backup run of the Supabase LP database, to either target:
//   'github'   Pranav's private repo (src/lib/backup/github.js), run by
//              /api/cron/supabase-sync after the keep-alive ping. The live target.
//   'onedrive' OneDrive via Microsoft Graph (src/lib/backup/graph.js), behind
//              /api/cron/onedrive-backup. Kept working, not scheduled.
// Steps: export the tables → stage the dated folder → copy bucket objects not
// yet backed up (time-boxed; the rest are marked `pending` and copied by the
// next run) → manifest.json + README.md → commit (GitHub: one commit per run)
// → read the listing back and verify every file's size (and git blob SHA on
// GitHub).
import { Resend } from 'resend';
import { BUCKET, FILES_DIR, buildManifest, exportTables, readmeText, runStamp, sha } from './export.js';
import { BACKUP_OWNER, backupTarget, driveClient, getBackupAccessToken, graphConfig, supabaseTokenStore } from './graph.js';
import { gitBlobSha, githubClient, githubConfig } from './github.js';

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

/**
 * deps (all optional, for tests and the script):
 *   { target: 'github' | 'onedrive', env, fetchImpl, now, store, supabase, drive,
 *     budgetMs, maxFiles, recheck, by }
 * recheck: also download files already backed up at the right size and rewrite
 * them only if their content differs (GitHub: compared by git blob SHA).
 * → { ok, complete, stamp, target, commit, tables, files: { total, kept, copied, pending, tooLarge }, verified, ms }
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
  const isGit = drive.kind === 'github';
  const supabase = deps.supabase || supabaseRest({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY, fetchImpl });

  const stamp = runStamp(new Date(started));
  const { tableFiles, manifestTables, typeCounts, fileRows } = await exportTables(supabase.rest);
  const objects = await supabase.listBucket();
  const rowByPath = new Map(fileRows.map((r) => [r.storage_path, r]));
  const expected = []; // [path under the backup root, bytes, gitSha?]

  // 1. Dated folder with the table files.
  await drive.ensureFolder?.(stamp);
  for (const [name, buf] of Object.entries(tableFiles)) {
    await drive.upload(`${stamp}/${name}`, buf);
    expected.push([`${stamp}/${name}`, buf.length, gitBlobSha(buf)]);
  }

  // 2. Bucket objects: copy only those not already in files/ at the right size.
  const present = await drive.listTree(FILES_DIR);
  const files = [];
  let copied = 0;
  for (const o of objects) {
    const row = rowByPath.get(o.path);
    const entry = { path: `${FILES_DIR}/${o.path}`, asset_id: row?.asset_id ?? null, sha1: row?.sha1 ?? null, bytes: o.size ?? row?.size_bytes ?? null, state: 'kept' };
    files.push(entry);
    const have = present.get(o.path);
    const sizeOk = have && (entry.bytes == null || have.size === entry.bytes);
    if (sizeOk && !deps.recheck) {
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
  const tooLarge = files.filter((f) => f.state === 'too-large');
  if (pending && copied === 0) throw new Error(`No new bucket file could be copied this run (${pending} pending); the time budget ran out before the first copy`);

  // 3. Manifest + README (GitHub leaves an unchanged README alone).
  const manifest = buildManifest({
    createdAt: new Date(started).toISOString(),
    source: supabase.url.replace(/^https:\/\//, ''),
    stamp,
    by: deps.by || TARGET_ROUTE[target],
    tables: manifestTables,
    typeCounts,
    files,
  });
  const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const readmeBuf = Buffer.from(readmeText({ target }), 'utf8');
  await drive.upload(`${stamp}/manifest.json`, manifestBuf);
  await drive.upload('README.md', readmeBuf);
  expected.push([`${stamp}/manifest.json`, manifestBuf.length, gitBlobSha(manifestBuf)], ['README.md', readmeBuf.length, gitBlobSha(readmeBuf)]);

  // 4. GitHub: one commit for the whole run.
  const docs = manifestTables.sanity_docs?.rows ?? 0;
  const committed = drive.commit ? await drive.commit(`backup: ${stamp} (${docs} docs, ${copied} new files)`) : null;

  // 5. Read back and verify every file of this run, every file kept from earlier runs, and the README.
  const under = (dir) => expected.filter(([p]) => p.startsWith(`${dir}/`)).map(([p, ...rest]) => [p.slice(dir.length + 1), ...rest]);
  verifyListing(await drive.listTree(stamp), under(stamp), `run folder ${stamp}`);
  verifyListing(await drive.listTree(FILES_DIR), under(FILES_DIR), `${FILES_DIR}/`);
  verifyListing(await drive.listTree('', { recursive: false }), expected.filter(([p]) => !p.includes('/')), 'backup root');

  if (tooLarge.length) {
    const list = tooLarge.map((f) => `${f.path} (${(f.bytes / 1048576).toFixed(1)} MB)`).join(', ');
    throw new Error(`${tooLarge.length} bucket file(s) over the ${drive.maxBytes / 1048576} MB limit were NOT backed up: ${list}. Tables and other files were backed up${committed?.sha ? ` in ${committed.sha}` : ''}.`);
  }

  return {
    ok: true,
    complete: pending === 0,
    stamp,
    target,
    commit: committed?.sha ?? null,
    tables: Object.fromEntries(Object.entries(manifestTables).map(([t, v]) => [t, v.missing ? 'missing' : v.rows])),
    files: { total: files.length, kept: files.length - copied - pending, copied, pending },
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
