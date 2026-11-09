// The Coordinator's edit tool (scripts/lp-edit.mjs): change LP records in
// Supabase and record the change in the private GitHub repo as its own commit.
//
//   1. Drift first: if the repo's records/ does not match Supabase (portal writes
//      since the last backup), commit that as `portal changes: …`, so the edit
//      commit shows only the edit.
//   2. Run the edit function on copies of the current docs; it returns the docs
//      it changed (and ids to delete).
//   3. Save them to sanity_docs (compare-and-swap on `rev`; new `_rev`, `_updatedAt`).
//   4. Commit exactly those record files (+ INDEX.md if a name changed) with the
//      given message and a line `Edited by Claude for Pranav`.
//   5. Read back from Supabase and from GitHub and confirm both match.
// dryRun: steps 1-2 are computed and printed (paths and changed keys, never
// values); nothing is written anywhere. Record files redact credentials
// (records.js), so the GitHub check compares the redacted form.
import { randomBytes } from 'node:crypto';
import { readTables } from './export.js';
import { RefRaceError, gitBlobSha, githubClient, githubConfig } from './github.js';
import { INDEX_FILE, RECORDS_DIR, indexMarkdown, portalChangesMessage, recordJson, recordPath, stableJson } from './records.js';
import { stageRecords, supabaseRest, verifyCommitted } from './run.js';

export const EDIT_TRAILER = 'Edited by Claude for Pranav';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

// Random alphanumeric token like Sanity's _rev values.
export function newRev(length = 22) {
  let out = '';
  while (out.length < length) {
    for (const b of randomBytes(length * 2)) if (b < 248 && out.length < length) out += ALPHABET[b % 62];
  }
  return out;
}

const clone = (v) => (v === undefined ? v : structuredClone(v));
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Dotted key paths that differ between a and b (arrays by index). Keys only.
export function changedKeys(a, b, prefix = '', out = []) {
  if (stableJson(a ?? null) === stableJson(b ?? null)) return out;
  if (isObj(a) && isObj(b)) {
    for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) changedKeys(a[k], b[k], prefix ? `${prefix}.${k}` : k, out);
  } else if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) changedKeys(a[i], b[i], `${prefix}[${i}]`, out);
  } else out.push(prefix || '(whole doc)');
  return out;
}

// filter: undefined (all) | 'type' | (doc) => bool | { type, id, ids, where }
function matcher(filter) {
  if (filter == null) return () => true;
  if (typeof filter === 'string') return (d) => d._type === filter;
  if (typeof filter === 'function') return filter;
  const ids = filter.ids ? new Set(filter.ids) : filter.id ? new Set([filter.id]) : null;
  return (d) => (!filter.type || d._type === filter.type) && (!ids || ids.has(d._id)) && (!filter.where || filter.where(d));
}

// What the edit function returned → { changed: [doc], deleted: [id] }, validated
// against the current rows. Unchanged docs are dropped (listed in `same`).
function normalize(result, rowById) {
  const changed = Array.isArray(result) ? result : result?.changed || [];
  const deleted = Array.isArray(result) ? [] : result?.deleted || [];
  if (!Array.isArray(changed) || !Array.isArray(deleted)) throw new Error('edit() must return an array of changed docs or { changed: [docs], deleted: [ids] }');
  const seen = new Set();
  const out = { changed: [], deleted: [], same: [] };
  for (const doc of changed) {
    if (!isObj(doc) || typeof doc._id !== 'string' || typeof doc._type !== 'string') throw new Error('every changed doc needs _id and _type');
    recordPath(doc._type, doc._id); // throws on an unsafe id/type
    if (seen.has(doc._id)) throw new Error(`doc ${doc._id} returned twice`);
    seen.add(doc._id);
    const row = rowById.get(doc._id);
    if (row && row.type !== doc._type) throw new Error(`doc ${doc._id}: _type cannot change (${row.type} → ${doc._type})`);
    if (row && stableJson(row.doc) === stableJson(doc)) out.same.push(doc._id);
    else out.changed.push(doc);
  }
  for (const id of deleted) {
    if (seen.has(id)) throw new Error(`doc ${id} is both changed and deleted`);
    if (!rowById.has(id)) throw new Error(`cannot delete ${id}: no such record`);
    seen.add(id);
    out.deleted.push(id);
  }
  return out;
}

const inList = (ids) => `in.(${ids.map((id) => `"${encodeURIComponent(id)}"`).join(',')})`;

async function readRows(supabase, ids) {
  if (!ids.length) return new Map();
  const res = await supabase.rest(`/rest/v1/sanity_docs?select=id,type,rev,doc&id=${inList(ids)}`);
  if (!res.ok) throw new Error(`Supabase read sanity_docs failed: ${res.status}`);
  return new Map((await res.json()).map((r) => [r.id, r]));
}

// Commit drift (Supabase ahead of the repo) as `portal changes: …`. A ref race
// re-reads Supabase and retries once. → { sha, sum, tables }
async function commitDrift(drive, supabase, tables, { dryRun }) {
  for (let attempt = 0; ; attempt++) {
    if (attempt) {
      drive.unstageText();
      ({ rows: tables } = await readTables(supabase.rest));
    }
    const staged = await stageRecords(drive, tables);
    if (!drive.staged.size || dryRun) {
      drive.unstageText();
      return { sha: null, sum: staged.sum, tables, pending: drive.staged.size };
    }
    try {
      const { sha } = await drive.commit(portalChangesMessage(staged.sum));
      await verifyCommitted(drive, staged.written, staged.removed);
      return { sha, sum: staged.sum, tables };
    } catch (err) {
      if (!(err instanceof RefRaceError) || attempt) throw err;
    }
  }
}

/**
 * opts: { message, edit: async (api) => docs | { changed, deleted }, dryRun,
 *         env, fetchImpl, now, supabase, drive, log, rev }
 * → { dryRun, drift: { commit, records }, edits: [{ path, action, keys }], commit, verified }
 */
export async function runEdit(opts) {
  const env = opts.env || process.env;
  const fetchImpl = opts.fetchImpl || fetch;
  const now = opts.now || Date.now;
  const log = opts.log || console;
  const rev = opts.rev || newRev;
  const message = String(opts.message || '').trim();
  if (!message) throw new Error('--message is required: say why the records change');
  if (EMAIL.test(message)) throw new Error('the commit message must not contain an email address');
  if (typeof opts.edit !== 'function') throw new Error('the edits module must export async function edit(api)');

  const supabase = opts.supabase || supabaseRest({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY, fetchImpl });
  const drive = opts.drive || githubClient({ ...githubConfig(env), fetchImpl });

  // 1. Drift.
  let { rows: tables } = await readTables(supabase.rest);
  const drift = await commitDrift(drive, supabase, tables, { dryRun: opts.dryRun });
  tables = drift.tables;
  if (drift.sum.records || drift.sum.tables.length) {
    log.log(`${opts.dryRun ? 'would commit' : `committed ${drift.sha}:`} portal changes first: ${drift.sum.records} records (added ${drift.sum.added}, changed ${drift.sum.changed}, removed ${drift.sum.removed})${drift.sum.tables.length ? `, tables ${drift.sum.tables.join(', ')}` : ''}`);
  }

  // 2. The edit, on copies.
  const rows = tables.sanity_docs || [];
  const rowById = new Map(rows.map((r) => [r.id, r]));
  const api = {
    getDocs: async (filter) => rows.map((r) => r.doc).filter(matcher(filter)).map(clone),
    getDoc: async (id) => clone(rowById.get(id)?.doc ?? null),
  };
  const plan = normalize(await opts.edit(api), rowById);
  const edits = [
    ...plan.changed.map((d) => {
      const row = rowById.get(d._id);
      return { path: `${RECORDS_DIR}/${recordPath(d._type, d._id)}`, action: row ? 'changed' : 'added', keys: changedKeys(row?.doc ?? {}, d).filter((k) => !['_rev', '_updatedAt'].includes(k)) };
    }),
    ...plan.deleted.map((id) => ({ path: `${RECORDS_DIR}/${recordPath(rowById.get(id).type, id)}`, action: 'deleted', keys: [] })),
  ];
  for (const e of edits) log.log(`${e.action.padEnd(7)} ${e.path}${e.keys.length ? `\n          keys: ${e.keys.slice(0, 40).join(', ')}${e.keys.length > 40 ? ` (+${e.keys.length - 40} more)` : ''}` : ''}`);
  if (plan.same.length) log.log(`unchanged (skipped): ${plan.same.length} doc(s)`);
  const base = { drift: { commit: drift.sha, records: drift.sum.records }, edits };
  if (opts.dryRun) return { dryRun: true, ...base, commit: null, verified: false };
  if (!edits.length) {
    log.log('nothing to change; no edit commit');
    return { dryRun: false, ...base, commit: null, verified: true };
  }

  // 3. Save to Supabase. Check first that nothing moved since the read.
  const ids = [...plan.changed.map((d) => d._id), ...plan.deleted];
  const live = await readRows(supabase, ids);
  for (const id of ids) {
    const was = rowById.get(id);
    const is = live.get(id);
    if ((was && !is) || (!was && is) || (was && is && was.rev !== is.rev)) throw new Error(`record ${id} changed in Supabase since it was read; nothing was saved. Run again.`);
  }
  const at = new Date(now()).toISOString();
  const saved = []; // { id, doc } or { id, deleted: true }
  let failure = null;
  try {
    for (const d of plan.changed) {
      const r = rev();
      const row = rowById.get(d._id);
      const doc = { ...d, ...(row ? {} : { _createdAt: d._createdAt || at }), _updatedAt: at, _rev: r };
      const body = { rev: r, sanity_updated_at: at, doc, synced_at: at };
      let out;
      if (row) {
        const revFilter = row.rev == null ? 'rev=is.null' : `rev=eq.${encodeURIComponent(row.rev)}`;
        out = await supabase.send('PATCH', `/rest/v1/sanity_docs?id=eq.${encodeURIComponent(d._id)}&${revFilter}`, body);
      } else {
        out = await supabase.send('POST', '/rest/v1/sanity_docs', { id: d._id, type: d._type, ...body });
      }
      if (!out?.length) throw new Error(`record ${d._id} changed in Supabase while saving`);
      saved.push({ id: d._id, type: d._type, doc });
    }
    for (const id of plan.deleted) {
      const row = rowById.get(id);
      const revFilter = row.rev == null ? 'rev=is.null' : `rev=eq.${encodeURIComponent(row.rev)}`;
      const out = await supabase.send('DELETE', `/rest/v1/sanity_docs?id=eq.${encodeURIComponent(id)}&${revFilter}`);
      if (!out?.length) throw new Error(`record ${id} changed in Supabase while deleting`);
      saved.push({ id, type: row.type, deleted: true });
    }
  } catch (err) {
    failure = err;
  }
  if (!saved.length) throw failure;

  // 4. Commit exactly what was saved (+ INDEX.md if it changed).
  const after = new Map(rows.map((r) => [r.id, r.doc]));
  for (const s of saved) (s.deleted ? after.delete(s.id) : after.set(s.id, s.doc));
  const files = saved.map((s) => [`${RECORDS_DIR}/${recordPath(s.type, s.id)}`, s.deleted ? null : recordJson(s.doc)]);
  files.push([`${RECORDS_DIR}/${INDEX_FILE}`, indexMarkdown([...after.values()])]);
  const note = failure ? `\n\nIncomplete: saved ${saved.length} of ${ids.length}; the rest failed (${failure.message.slice(0, 200)})` : '';
  const commitMessage = `${message}\n\n${EDIT_TRAILER}${note}`;
  let committed;
  let written;
  let removed;
  for (let attempt = 0; ; attempt++) {
    const listing = await drive.listTree('');
    written = [];
    removed = [];
    for (const [rel, content] of files) {
      if (content === null) {
        if (listing.has(rel)) { drive.stageRemove(rel); removed.push(rel); }
        continue;
      }
      const sha = gitBlobSha(Buffer.from(content, 'utf8'));
      if (listing.get(rel)?.sha === sha) continue;
      drive.stageText(rel, content);
      written.push([rel, sha]);
    }
    try {
      committed = await drive.commit(commitMessage);
      break;
    } catch (err) {
      if (!(err instanceof RefRaceError) || attempt) throw err;
      drive.unstageText();
    }
  }

  // 5. Read back both sides.
  const back = await readRows(supabase, saved.map((s) => s.id));
  const bad = [];
  for (const s of saved) {
    const row = back.get(s.id);
    if (s.deleted) { if (row) bad.push(`${s.id} still in Supabase`); continue; }
    if (!row) bad.push(`${s.id} missing in Supabase`);
    else if (stableJson(row.doc) !== stableJson(s.doc)) bad.push(`${s.id} differs in Supabase`);
  }
  if (committed.sha) await verifyCommitted(drive, written, removed);
  const tree = await drive.listTree(RECORDS_DIR);
  for (const s of saved) {
    const rel = recordPath(s.type, s.id);
    const row = back.get(s.id);
    if (s.deleted) { if (tree.has(rel)) bad.push(`${rel} still in GitHub`); continue; }
    if (row && tree.get(rel)?.sha !== gitBlobSha(Buffer.from(recordJson(row.doc), 'utf8'))) bad.push(`${rel} in GitHub does not match Supabase`);
  }
  if (bad.length) throw new Error(`Read-back failed: ${bad.slice(0, 5).join('; ')}`);
  if (failure) throw new Error(`Saved and committed ${saved.length} of ${ids.length} (${committed.sha}); then failed: ${failure.message}`);
  log.log(`saved ${saved.length} record(s) to Supabase; committed ${committed.sha}; read back from Supabase and GitHub: match`);
  return { dryRun: false, ...base, commit: committed.sha, verified: true };
}
