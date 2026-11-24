// Private documents that used to live in Sanity (newsletter subscribers, the pitch
// scheduler) are rows of Supabase `sanity_docs`, in the same shape as the Sanity
// documents they replaced, so they share the LP data's backups and edit history
// (src/lib/backup). Server-side only: the secret key never reaches a browser.
import { supa, supaAll, enc, isSafeId } from './lp-data/rest.js';
import { isPublishedId } from './lp-data/groq.js';
import { createDoc, patchDoc, sanityStyleId } from './lp-data/supabase-writes.js';

export { createDoc, patchDoc };

// Every published document of one type. These types are small (hundreds at most).
export async function listDocs(type) {
  if (!isSafeId(type)) throw new Error('listDocs: invalid type');
  const rows = await supaAll(`/rest/v1/sanity_docs?select=id,doc&type=eq.${enc(type)}`);
  return rows.filter((r) => isPublishedId(r.id)).map((r) => r.doc);
}

export async function getDoc(id) {
  if (!isSafeId(id)) throw new Error('getDoc: invalid document id');
  const { rows } = await supa(`/rest/v1/sanity_docs?select=doc&id=eq.${enc(id)}`);
  return rows?.[0]?.doc || null;
}

// Create or replace a document with a fixed id (singletons such as the slot cache,
// or an invitation whose id is chosen elsewhere). Keeps the original _createdAt.
export async function putDoc(id, type, fields) {
  if (!isSafeId(id) || !isSafeId(type)) throw new Error('putDoc: invalid id or type');
  const now = new Date().toISOString();
  const before = await getDoc(id);
  const rev = sanityStyleId();
  const doc = { _id: id, _type: type, ...fields, _createdAt: before?._createdAt || now, _updatedAt: now, _rev: rev };
  await supa('/rest/v1/sanity_docs?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { id, type, rev, sanity_updated_at: now, doc, synced_at: now },
  });
  return doc;
}

export async function deleteDocs(ids) {
  const safe = ids.filter(isSafeId);
  if (!safe.length) return 0;
  await supa(`/rest/v1/sanity_docs?id=in.(${safe.map((id) => enc(`"${id}"`)).join(',')})`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return safe.length;
}

// Compare-and-swap with NO retry: applies `change` only if the document is still at
// revision `rev` (the one the caller read). Returns the new doc, or null if someone
// else changed it first. For single-use transitions (a pitch slot being claimed).
export async function patchDocIfRev(id, rev, change) {
  if (!isSafeId(id) || typeof rev !== 'string') throw new Error('patchDocIfRev: invalid id or revision');
  const { rows } = await supa(`/rest/v1/sanity_docs?select=doc&id=eq.${enc(id)}&rev=eq.${enc(rev)}`);
  const current = rows?.[0]?.doc;
  if (!current) return null;
  const now = new Date().toISOString();
  const next = sanityStyleId();
  const doc = { ...change(current), _updatedAt: now, _rev: next };
  const { rows: updated } = await supa(`/rest/v1/sanity_docs?id=eq.${enc(id)}&rev=eq.${enc(rev)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: { rev: next, sanity_updated_at: now, doc, synced_at: now },
  });
  return updated?.length ? doc : null;
}
