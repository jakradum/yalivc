// Supabase versions of the LP writes: they change `sanity_docs` rows in place.
// New documents get Sanity-style metadata (_id, _type, _createdAt, _updatedAt, _rev).
// Patches are a compare-and-swap on the row's `rev`, retried once if another write
// got there first.
import crypto from 'crypto';
import { supa, enc, isSafeId } from './rest.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Random alphanumeric token like Sanity's generated _id / _rev values.
export function sanityStyleId(length = 22) {
  const bytes = crypto.randomBytes(length * 2);
  let out = '';
  for (let i = 0; i < bytes.length && out.length < length; i++) {
    if (bytes[i] < 248) out += ALPHABET[bytes[i] % 62]; // 248 = 4 * 62: no modulo bias
  }
  return out.length === length ? out : sanityStyleId(length);
}

export async function createDoc(type, fields) {
  const now = new Date().toISOString();
  const doc = { _id: sanityStyleId(), _type: type, ...fields, _createdAt: now, _updatedAt: now, _rev: sanityStyleId() };
  await supa('/rest/v1/sanity_docs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: { id: doc._id, type, rev: doc._rev, sanity_updated_at: now, doc, synced_at: now },
  });
  return doc;
}

// Apply `change(doc) → newDoc` to one document with compare-and-swap on rev.
export async function patchDoc(id, change) {
  if (!isSafeId(id)) throw new Error('patchDoc: invalid document id');
  for (let attempt = 0; attempt < 2; attempt++) {
    const { rows } = await supa(`/rest/v1/sanity_docs?select=id,rev,doc&id=eq.${enc(id)}`);
    const row = rows?.[0];
    if (!row) throw new Error('Document not found');
    const now = new Date().toISOString();
    const rev = sanityStyleId();
    const doc = { ...change(row.doc), _updatedAt: now, _rev: rev };
    const revFilter = row.rev === null || row.rev === undefined ? 'rev=is.null' : `rev=eq.${enc(row.rev)}`;
    const { rows: updated } = await supa(`/rest/v1/sanity_docs?id=eq.${enc(id)}&${revFilter}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: { rev, sanity_updated_at: now, doc, synced_at: now },
    });
    if (updated?.length) return doc;
  }
  throw new Error('Document changed while patching; try again');
}

export const createDownloadConsent = (fields) => createDoc('lpDownloadConsent', fields);
export const createPortalFeedback = (fields) => createDoc('lpPortalFeedback', fields);

export async function updateLPReportSnapshot(docId, snapshotData, snapshotTimestamp) {
  return patchDoc(docId, (doc) => ({ ...doc, snapshotData, snapshotTimestamp }));
}
