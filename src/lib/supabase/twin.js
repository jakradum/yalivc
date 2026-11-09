// Sanity → Supabase twin (phase 1 of moving sensitive data out of Sanity).
//
// Copies every PUBLISHED document of the sensitive types below into the private
// `sanity_docs` table, removes rows whose document no longer exists, and copies
// the PDFs and images those documents reference into the private `sanity-files`
// bucket. Sanity stays the editing source for now.
// Schema: supabase/migrations/0001_sanity_twin.sql, 0002_sync_control.sql.
//
// Control (0002):
// - `sync_types`: a type set to enabled = false is skipped entirely (never
//   upserted, never deleted from), e.g. once Supabase is that type's source.
//   Twin types missing from the table are treated as enabled and added.
// - `sync_lock` via take_sync_lock / release_sync_lock: one sync at a time. A
//   run that finds the lock held returns { skipped: 'locked' } and does nothing.
// - `sync_runs.counts`: per-type { sanity, supabase } counts after every run;
//   any mismatch on an enabled type marks the run failed and throws.
//
// Server-only: uses the Supabase secret key (bypasses RLS) and the Sanity read
// token. Plain fetch, no extra dependencies.
import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@sanity/client';

export const TWIN_TYPES = [
  // LP portal
  'portalUser', 'domainPrivilege', 'lpDownloadConsent', 'lpPortalFeedback',
  'lpFundSettings', 'lpQuarterlyReport', 'company',
  // legacy LP records (no longer read by the site; mirrored so nothing is lost)
  'lpInvestment', 'lpCompanyQuarterUpdate', 'quarterlyReport', 'lpPipelineDeal',
  // data room
  'dataRoomDocument', 'dataroomFundContent', 'dataroomSectionVisibility',
  'fund2Settings', 'trackRecord', 'investor',
  // pitch scheduler
  'pitchSchedulerInvitation', 'pitchSchedulerCalendarAuth', 'pitchSchedulerSlotCache',
  // other personal data
  'contactSubmission', 'newsletterSubscriber', 'letterheadDocument',
  // team travel requests (_id under "travel.", readable only with a token)
  'travelRequest',
];

// Types that used to be twinned and no longer are: their rows are removed
// (unless sync_types has them disabled). Rows of any other type are left alone.
export const RETIRED_TYPES = ['investorRelations'];

const BUCKET = 'sanity-files';
const LOCK_TTL_SECONDS = 120;   // a killed run frees the lock after this
const LOCK_REFRESH_MS = 30_000; // long runs extend it this often
const PAGE = 1000;              // PostgREST's default max rows per response

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const sanityToken = process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN;
  if (!url || !key || !sanityToken) throw new Error('SUPABASE_URL, SUPABASE_SECRET_KEY and a Sanity token are required');
  return { url, key, sanityToken };
}

async function supaRaw(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const { url, key } = config();
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(raw ? {} : { 'Content-Type': 'application/json' }), ...headers },
    body: raw ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} → ${res.status} ${await res.text()}`);
  return res;
}

async function supa(path, opts) {
  const text = await (await supaRaw(path, opts)).text();
  return text ? JSON.parse(text) : null;
}

// GET every row of a PostgREST read, past the per-response row cap, using
// Range headers. `path` should include an `order=` so pages are stable.
async function supaAll(path) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    let page;
    try {
      page = await supa(path, { headers: { 'Range-Unit': 'items', Range: `${from}-${from + PAGE - 1}` } });
    } catch (err) {
      if (from > 0 && / → 416 /.test(err.message)) return rows; // asked past the end
      throw err;
    }
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

// One cheap read, so the free project doesn't pause after 7 idle days. Used by
// the cron route while the copy from Sanity is off (Pranav, 9 Nov 2026).
export async function keepAlive() {
  const rows = await supa('/rest/v1/sanity_docs?select=id&limit=1');
  return { pinged: true, rows: rows?.length ?? 0 };
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// PostgREST `in.(...)` list with each value double-quoted and escaped.
const inList = (values) => `in.(${values.map((v) => encodeURIComponent(`"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)).join(',')})`;

// Postgres jsonb cannot hold \u0000; drop it from every string (keys too).
export function stripNul(value) {
  if (typeof value === 'string') return value.includes('\u0000') ? value.replace(/\u0000/g, '') : value;
  if (Array.isArray(value)) return value.map(stripNul);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [stripNul(k), stripNul(v)]));
  }
  return value;
}

// File and image assets referenced anywhere inside a document (asset refs look
// like { _ref: "file-<sha1>-<ext>" } or { _ref: "image-<sha1>-<W>x<H>-<ext>" }).
function assetRefs(value, out = new Set()) {
  if (Array.isArray(value)) value.forEach((v) => assetRefs(v, out));
  else if (value && typeof value === 'object') {
    if (typeof value._ref === 'string' && /^(file|image)-/.test(value._ref)) out.add(value._ref);
    Object.values(value).forEach((v) => assetRefs(v, out));
  }
  return out;
}

const countBy = (items, key) => items.reduce((m, x) => m.set(key(x), (m.get(key(x)) || 0) + 1), new Map());

async function takeLock(holder) {
  return (await supa('/rest/v1/rpc/take_sync_lock', { method: 'POST', body: { p_holder: holder, p_ttl_seconds: LOCK_TTL_SECONDS } })) === true;
}
async function releaseLock(holder) {
  await supa('/rest/v1/rpc/release_sync_lock', { method: 'POST', body: { p_holder: holder } });
}

/**
 * Run one sync. Only documents whose _rev changed are written, so a run is
 * incremental. Options:
 *   files: copy referenced PDFs and images too (default true). Skips ones already copied.
 *   log:   optional (msg) => void for progress.
 * Returns { skipped: 'locked' } when another sync holds the lock, otherwise
 * { docsUpserted, docsDeleted, filesUploaded, docsTotal, assetsReferenced, disabledTypes, counts }
 * where counts = { <type>: { sanity, supabase } } for every enabled twin type.
 */
export async function syncTwin({ files = true, log = () => {} } = {}) {
  const { sanityToken } = config();
  const holder = randomUUID();
  if (!(await takeLock(holder))) {
    log('another sync holds the lock; skipped');
    return { skipped: 'locked' };
  }
  let lastRefresh = Date.now();
  const keepLock = async () => {
    if (Date.now() - lastRefresh < LOCK_REFRESH_MS) return;
    if (!(await takeLock(holder))) throw new Error('Lost the sync lock (run took longer than its expiry)');
    lastRefresh = Date.now();
  };

  try {
    const sanity = createClient({
      projectId: 'nt0wmty3', dataset: 'production', apiVersion: '2024-01-01',
      useCdn: false, token: sanityToken, perspective: 'published',
    });

    const [run] = await supa('/rest/v1/sync_runs', { method: 'POST', body: {}, headers: { Prefer: 'return=representation' } });
    const result = { docsUpserted: 0, docsDeleted: 0, filesUploaded: 0, docsTotal: 0, assetsReferenced: 0, disabledTypes: [], counts: {} };
    const finish = (extra) => supa(`/rest/v1/sync_runs?id=eq.${run.id}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: {
        finished_at: new Date().toISOString(), docs_upserted: result.docsUpserted, docs_deleted: result.docsDeleted,
        files_uploaded: result.filesUploaded, counts: result.counts, ...extra,
      },
    });

    try {
      // 0. Which types are on
      const typeRows = await supaAll('/rest/v1/sync_types?select=type,enabled&order=type');
      const disabled = new Set(typeRows.filter((r) => r.enabled === false).map((r) => r.type));
      const listed = new Set(typeRows.map((r) => r.type));
      const missing = TWIN_TYPES.filter((t) => !listed.has(t));
      if (missing.length) {
        await supa('/rest/v1/sync_types?on_conflict=type', {
          method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: missing.map((type) => ({ type, enabled: true, note: 'added by twin sync' })),
        });
        log(`sync_types: added ${missing.length} missing type(s)`);
      }
      const types = TWIN_TYPES.filter((t) => !disabled.has(t));
      result.disabledTypes = TWIN_TYPES.filter((t) => disabled.has(t));
      // Rows this run may write or delete: enabled twin types, plus retired types.
      const managed = new Set([...types, ...RETIRED_TYPES.filter((t) => !disabled.has(t))]);

      // 1. Documents
      const docs = types.length ? await sanity.fetch('*[_type in $types]', { types }) : [];
      result.docsTotal = docs.length;
      const existing = (await supaAll('/rest/v1/sanity_docs?select=id,type,rev&order=id')).filter((r) => managed.has(r.type));
      const revById = new Map(existing.map((r) => [r.id, r.rev]));
      const changed = docs.filter((d) => revById.get(d._id) !== d._rev);
      for (const batch of chunk(changed, 200)) {
        await keepLock();
        await supa('/rest/v1/sanity_docs?on_conflict=id', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: batch.map((d) => ({ id: d._id, type: d._type, rev: d._rev, sanity_updated_at: d._updatedAt, doc: stripNul(d), synced_at: new Date().toISOString() })),
        });
        result.docsUpserted += batch.length;
      }
      const live = new Set(docs.map((d) => d._id));
      const gone = existing.map((r) => r.id).filter((id) => !live.has(id));
      for (const batch of chunk(gone, 100)) {
        await keepLock();
        await supa(`/rest/v1/sanity_docs?id=${inList(batch)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
        result.docsDeleted += batch.length;
      }
      log(`docs: ${docs.length} in Sanity, ${result.docsUpserted} written, ${result.docsDeleted} removed`);

      // 2. Files (PDFs) and images referenced by those documents
      const badHashes = [];
      if (files) {
        const ids = [...docs.reduce((s, d) => assetRefs(d, s), new Set())];
        result.assetsReferenced = ids.length;
        const have = new Set((await supaAll('/rest/v1/sanity_files?select=asset_id&order=asset_id')).map((r) => r.asset_id));
        const todo = ids.filter((id) => !have.has(id));
        if (todo.length) {
          const assets = await sanity.fetch('*[_id in $ids]{_id, url, mimeType, size, originalFilename, sha1hash, extension}', { ids: todo });
          for (const a of assets) {
            await keepLock();
            const isImage = a._id.startsWith('image-');
            // The image CDN re-encodes by default (format negotiation, metadata
            // stripping); `dlRaw` with the token returns the original upload.
            const res = await fetch(isImage ? `${a.url}?dlRaw=` : a.url, isImage ? { headers: { Authorization: `Bearer ${sanityToken}` } } : undefined);
            if (!res.ok) throw new Error(`Sanity asset download → ${res.status}`);
            const bytes = Buffer.from(await res.arrayBuffer());
            const sha1 = createHash('sha1').update(bytes).digest('hex');
            if (a.sha1hash && sha1 !== a.sha1hash) { badHashes.push(a._id); continue; }
            const ext = a.extension || a._id.split('-').pop() || (isImage ? 'bin' : 'pdf');
            const path = `${a._id}.${ext}`;
            await supaRaw(`/storage/v1/object/${BUCKET}/${path}`, {
              method: 'POST', raw: true, body: bytes,
              headers: { 'Content-Type': a.mimeType || (isImage ? `image/${ext}` : 'application/pdf'), 'x-upsert': 'true' },
            });
            await supa('/rest/v1/sanity_files?on_conflict=asset_id', {
              method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
              body: { asset_id: a._id, storage_path: path, mime_type: a.mimeType, size_bytes: a.size ?? bytes.length, original_filename: a.originalFilename, sha1, synced_at: new Date().toISOString() },
            });
            result.filesUploaded += 1;
            log(`asset ${result.filesUploaded}/${assets.length} copied`);
          }
          if (assets.length < todo.length) log(`assets: ${todo.length - assets.length} referenced but not found in Sanity`);
        }
        log(`assets: ${ids.length} referenced, ${result.filesUploaded} newly copied`);
      }

      // 3. Per-type counts, Sanity vs Supabase, for every enabled twin type
      const sanityCounts = countBy(docs, (d) => d._type);
      const supaCounts = countBy(await supaAll('/rest/v1/sanity_docs?select=id,type&order=id'), (r) => r.type);
      for (const t of types) result.counts[t] = { sanity: sanityCounts.get(t) || 0, supabase: supaCounts.get(t) || 0 };
      const mismatched = types.filter((t) => result.counts[t].sanity !== result.counts[t].supabase);

      const problems = [];
      if (mismatched.length) problems.push(`count mismatch for ${mismatched.join(', ')}`);
      if (badHashes.length) problems.push(`${badHashes.length} asset(s) failed the SHA-1 check and were not copied`);
      if (problems.length) {
        const message = problems.join('; ');
        await finish({ error: message });
        const err = new Error(`Twin sync: ${message}`);
        err.recorded = true;
        throw err;
      }
      await finish();
      return result;
    } catch (err) {
      if (!err.recorded) await finish({ error: String(err.message || err).slice(0, 2000) }).catch(() => {});
      throw err;
    }
  } finally {
    await releaseLock(holder).catch(() => {});
  }
}
