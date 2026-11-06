// One OneDrive backup run (GET /api/cron/onedrive-backup). Independent of the
// twin sync. Steps: refresh the Graph token → export the tables → write the
// dated folder → copy new bucket PDFs (time-boxed; the rest are marked
// `pending` and copied by the next run) → verify through Graph that every
// file is there with the right size → write manifest.json and README.md and
// verify those too.
import { Resend } from 'resend';
import { BUCKET, FILES_DIR, buildManifest, exportTables, readmeText, runStamp, sha } from './export.js';
import { BACKUP_OWNER, backupTarget, driveClient, getBackupAccessToken, graphConfig, supabaseTokenStore } from './graph.js';

// Stop starting new PDF copies after this long, so the run (tables, verify,
// manifest) always fits inside the function's 60 s.
export const FILE_BUDGET_MS = 30_000;
export const MAX_FILES_PER_RUN = 40;

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
  };
}

function checkSizes(listing, expected, where) {
  const bad = [];
  for (const [name, bytes] of expected) {
    const got = listing.get(name);
    if (got === undefined) bad.push(`${name} missing`);
    else if (bytes != null && got !== bytes) bad.push(`${name} is ${got} bytes, expected ${bytes}`);
  }
  if (bad.length) throw new Error(`Verification of ${where} failed: ${bad.slice(0, 5).join('; ')}${bad.length > 5 ? ` (+${bad.length - 5} more)` : ''}`);
}

/**
 * deps (all optional, for tests): { env, fetchImpl, now, store, supabase, drive, budgetMs, maxFiles }
 * → { ok, complete, stamp, tables, files: { total, kept, copied, pending }, verified }
 * Throws NotConfiguredError / NotConnectedError before touching anything when not set up.
 */
export async function runBackup(deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetchImpl || fetch;
  const now = deps.now || Date.now;
  const started = now();
  const budgetMs = deps.budgetMs ?? FILE_BUDGET_MS;
  const maxFiles = deps.maxFiles ?? MAX_FILES_PER_RUN;

  const target = backupTarget(env);
  let drive = deps.drive;
  if (!drive) {
    const config = graphConfig(env);
    const store = deps.store || supabaseTokenStore({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY, fetchImpl });
    const token = await getBackupAccessToken({ store, target, config, fetchImpl });
    drive = driveClient({ token, target, fetchImpl });
  }
  const supabase = deps.supabase || supabaseRest({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY, fetchImpl });

  const stamp = runStamp(new Date(started));
  const { tableFiles, manifestTables, typeCounts, fileRows } = await exportTables(supabase.rest);

  // 1. Dated folder with the table files.
  await drive.ensureFolder(stamp);
  for (const [name, buf] of Object.entries(tableFiles)) await drive.upload(`${stamp}/${name}`, buf);

  // 2. Bucket PDFs: copy only those not already in files/ (with the right size).
  await drive.ensureFolder(FILES_DIR);
  const present = await drive.listChildren(FILES_DIR);
  const files = [];
  let copied = 0;
  for (const f of fileRows) {
    const entry = { asset_id: f.asset_id, path: `${FILES_DIR}/${f.storage_path}`, sha1: f.sha1, bytes: f.size_bytes, state: 'kept' };
    files.push(entry);
    const have = present.get(f.storage_path);
    if (have !== undefined && (f.size_bytes == null || have === f.size_bytes)) continue;
    if (copied >= maxFiles || now() - started > budgetMs) {
      entry.state = 'pending';
      continue;
    }
    const buf = await supabase.download(f.storage_path);
    if (f.sha1 && sha('sha1', buf) !== f.sha1) throw new Error(`Bucket file ${f.asset_id} failed its SHA-1 check`);
    const size = await drive.upload(`${FILES_DIR}/${f.storage_path}`, buf);
    if (size !== buf.length) throw new Error(`Upload of ${f.asset_id} returned ${size} bytes, expected ${buf.length}`);
    entry.bytes = buf.length;
    entry.state = 'copied';
    copied++;
  }
  const pending = files.filter((f) => f.state === 'pending').length;
  if (pending && copied === 0) throw new Error(`No new bucket PDF could be copied this run (${pending} pending); the time budget ran out before the first copy`);

  // 3. Verify the table files and the PDFs through Graph.
  checkSizes(await drive.listChildren(stamp), Object.entries(tableFiles).map(([n, b]) => [n, b.length]), `run folder ${stamp}`);
  const filesListing = await drive.listChildren(FILES_DIR);
  checkSizes(filesListing, files.filter((f) => f.state !== 'pending').map((f) => [f.path.slice(FILES_DIR.length + 1), f.bytes]), `${FILES_DIR}/`);

  // 4. Manifest + README, then verify those too.
  const manifest = buildManifest({
    createdAt: new Date(started).toISOString(),
    source: supabase.url.replace(/^https:\/\//, ''),
    stamp,
    by: 'api/cron/onedrive-backup',
    tables: manifestTables,
    typeCounts,
    files,
  });
  const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const readmeBuf = Buffer.from(readmeText(), 'utf8');
  await drive.upload(`${stamp}/manifest.json`, manifestBuf);
  await drive.upload('README.md', readmeBuf);
  checkSizes(await drive.listChildren(stamp), [['manifest.json', manifestBuf.length]], `run folder ${stamp}`);
  checkSizes(await drive.listChildren(''), [['README.md', readmeBuf.length]], 'backup root');

  return {
    ok: true,
    complete: pending === 0,
    stamp,
    target: target.mode,
    tables: Object.fromEntries(Object.entries(manifestTables).map(([t, v]) => [t, v.missing ? 'missing' : v.rows])),
    files: { total: files.length, kept: files.length - copied - pending, copied, pending },
    verified: true,
    ms: now() - started,
  };
}

// Failure alert: the error message only, never data.
export async function notifyFailure(message, { env = process.env, resend } = {}) {
  const key = env.RESEND_API_KEY;
  if (!key && !resend) {
    console.error('[onedrive-backup] RESEND_API_KEY missing; could not send the failure email');
    return false;
  }
  const client = resend || new Resend(key);
  const text = `The Yali LP data backup to OneDrive failed at ${new Date().toISOString()}.\n\nError: ${String(message).slice(0, 500)}\n\nSee the Vercel logs for /api/cron/onedrive-backup. Manual fallback: node scripts/backup-supabase-to-onedrive.mjs`;
  const { error } = await client.emails.send({
    from: 'Yali Partners <noreply@yali.vc>',
    to: BACKUP_OWNER,
    subject: 'Yali LP data backup failed',
    text,
  });
  if (error) {
    console.error('[onedrive-backup] failure email not sent:', error.message || error.name);
    return false;
  }
  return true;
}
