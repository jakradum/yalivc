// Sanity → Supabase twin (phase 1 of moving sensitive data out of Sanity).
//
// Copies every PUBLISHED document of the sensitive types below into the private
// `sanity_docs` table, removes rows whose document no longer exists, and copies
// the PDFs those documents reference into the private `sanity-files` bucket.
// Sanity stays the editing source for now; nothing on the site reads the twin
// yet. Schema: supabase/migrations/0001_sanity_twin.sql.
//
// Server-only: uses the Supabase secret key (bypasses RLS) and the Sanity read
// token. Plain fetch, no extra dependencies.
import { createClient } from '@sanity/client';

export const TWIN_TYPES = [
  // LP portal
  'portalUser', 'domainPrivilege', 'lpDownloadConsent', 'lpPortalFeedback',
  'lpFundSettings', 'lpQuarterlyReport', 'company',
  // legacy LP records (no longer read by the site; mirrored so nothing is lost)
  'lpInvestment', 'lpCompanyQuarterUpdate', 'quarterlyReport',
  // data room
  'dataRoomDocument', 'dataroomFundContent', 'dataroomSectionVisibility',
  'fund2Settings', 'investorRelations', 'trackRecord',
  // pitch scheduler
  'pitchSchedulerInvitation', 'pitchSchedulerCalendarAuth', 'pitchSchedulerSlotCache',
  // other personal data
  'contactSubmission', 'newsletterSubscriber', 'letterheadDocument',
];

const BUCKET = 'sanity-files';

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const sanityToken = process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN;
  if (!url || !key || !sanityToken) throw new Error('SUPABASE_URL, SUPABASE_SECRET_KEY and a Sanity token are required');
  return { url, key, sanityToken };
}

async function supa(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const { url, key } = config();
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(raw ? {} : { 'Content-Type': 'application/json' }), ...headers },
    body: raw ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} → ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// One cheap read, so the free project doesn't pause after 7 idle days. Used by
// the cron route while the copy from Sanity is off (Pranav, 9 Nov 2026).
export async function keepAlive() {
  const rows = await supa('/rest/v1/sanity_docs?select=id&limit=1');
  return { pinged: true, rows: rows?.length ?? 0 };
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// File assets referenced anywhere inside a document (asset refs look like
// { _ref: "file-<sha1>-<ext>" }).
function fileRefs(value, out = new Set()) {
  if (Array.isArray(value)) value.forEach((v) => fileRefs(v, out));
  else if (value && typeof value === 'object') {
    if (typeof value._ref === 'string' && value._ref.startsWith('file-')) out.add(value._ref);
    Object.values(value).forEach((v) => fileRefs(v, out));
  }
  return out;
}

/**
 * Run one sync. Options:
 *   files: copy referenced PDFs too (default true). Skips files already copied.
 *   log:   optional (msg) => void for progress.
 * Returns { docsUpserted, docsDeleted, filesUploaded, docsTotal }.
 */
export async function syncTwin({ files = true, log = () => {} } = {}) {
  const { sanityToken } = config();
  const sanity = createClient({
    projectId: 'nt0wmty3', dataset: 'production', apiVersion: '2024-01-01',
    useCdn: false, token: sanityToken, perspective: 'published',
  });

  const [run] = await supa('/rest/v1/sync_runs', { method: 'POST', body: {}, headers: { Prefer: 'return=representation' } });
  const result = { docsUpserted: 0, docsDeleted: 0, filesUploaded: 0, docsTotal: 0 };
  try {
    // 1. Documents
    const docs = await sanity.fetch('*[_type in $types]', { types: TWIN_TYPES });
    result.docsTotal = docs.length;
    const existing = await supa(`/rest/v1/sanity_docs?select=id,rev&type=in.(${TWIN_TYPES.join(',')})`);
    const revById = new Map(existing.map((r) => [r.id, r.rev]));
    const changed = docs.filter((d) => revById.get(d._id) !== d._rev);
    for (const batch of chunk(changed, 200)) {
      await supa('/rest/v1/sanity_docs?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: batch.map((d) => ({ id: d._id, type: d._type, rev: d._rev, sanity_updated_at: d._updatedAt, doc: d, synced_at: new Date().toISOString() })),
      });
      result.docsUpserted += batch.length;
    }
    const live = new Set(docs.map((d) => d._id));
    const gone = existing.map((r) => r.id).filter((id) => !live.has(id));
    for (const batch of chunk(gone, 100)) {
      await supa(`/rest/v1/sanity_docs?id=in.(${batch.map((id) => `"${id.replace(/"/g, '')}"`).join(',')})`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      result.docsDeleted += batch.length;
    }
    log(`docs: ${docs.length} in Sanity, ${result.docsUpserted} written, ${result.docsDeleted} removed`);

    // 2. Files (PDFs) referenced by those documents
    if (files) {
      const ids = [...docs.reduce((s, d) => fileRefs(d, s), new Set())];
      const have = new Set((await supa('/rest/v1/sanity_files?select=asset_id')).map((r) => r.asset_id));
      const todo = ids.filter((id) => !have.has(id));
      if (todo.length) {
        const assets = await sanity.fetch('*[_id in $ids]{_id, url, mimeType, size, originalFilename, sha1hash, extension}', { ids: todo });
        for (const a of assets) {
          const path = `${a._id}.${a.extension || 'pdf'}`;
          const bytes = await (await fetch(a.url)).arrayBuffer();
          await supa(`/storage/v1/object/${BUCKET}/${path}`, {
            method: 'POST', raw: true, body: bytes,
            headers: { 'Content-Type': a.mimeType || 'application/pdf', 'x-upsert': 'true' },
          });
          await supa('/rest/v1/sanity_files?on_conflict=asset_id', {
            method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: { asset_id: a._id, storage_path: path, mime_type: a.mimeType, size_bytes: a.size, original_filename: a.originalFilename, sha1: a.sha1hash, synced_at: new Date().toISOString() },
          });
          result.filesUploaded += 1;
          log(`file ${result.filesUploaded}/${assets.length}: ${a.originalFilename || a._id}`);
        }
      }
      log(`files: ${ids.length} referenced, ${result.filesUploaded} newly copied`);
    }

    await supa(`/rest/v1/sync_runs?id=eq.${run.id}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: { finished_at: new Date().toISOString(), docs_upserted: result.docsUpserted, docs_deleted: result.docsDeleted, files_uploaded: result.filesUploaded },
    });
    return result;
  } catch (err) {
    await supa(`/rest/v1/sync_runs?id=eq.${run.id}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: { finished_at: new Date().toISOString(), error: String(err.message || err).slice(0, 2000) },
    }).catch(() => {});
    throw err;
  }
}
