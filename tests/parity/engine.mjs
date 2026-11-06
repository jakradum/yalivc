// Reference engine: runs the original GROQ with groq-js over a set of documents, adjusted to
// behave like the hosted Sanity API where the two were measured to differ (see the probe
// notes in the B4 evidence file, 6 Nov 2026):
//
// 1. Default order. Hosted returns unordered results, and breaks every order() tie, by _id
//    ascending (also for `desc`). groq-js keeps dataset order with a stable sort, so the
//    dataset is handed to groq-js sorted by _id; with that, every ordering probe matched.
// 2. lower(). Hosted lowercases one code point at a time (U+0130 'İ' -> 'i', final 'Σ' ->
//    'σ'); groq-js uses JS toLowerCase ('İ' -> 'i̇', word-final 'Σ' -> 'ς'). The only
//    lower() in these queries is lower(email) on portalUser, so for queries that use it the
//    stored emails are pre-lowered the hosted way (lower() is then a no-op in groq-js) and
//    the original email is put back into any result object that carries it.
// 3. Drafts are never visible (perspective 'published'): ids starting with 'drafts.' or
//    'versions.' are dropped.
import { parse, evaluate } from 'groq-js';

export function hostedLower(s) {
  if (typeof s !== 'string') return s;
  let out = '';
  for (const ch of s) {
    const l = ch.toLowerCase();
    out += [...l].length === 1 ? l : [...l][0];
  }
  return out;
}

const byId = (a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0);

export function makeFetch(docs) {
  const published = docs.filter((d) => !d._id.startsWith('drafts.') && !d._id.startsWith('versions.')).sort(byId);
  const originalEmail = new Map();
  const lowered = published.map((d) => {
    if (d._type !== 'portalUser' || typeof d.email !== 'string') return d;
    const e = hostedLower(d.email);
    if (e === d.email) return d;
    originalEmail.set(d._id, d.email);
    return { ...d, email: e };
  });
  const restore = (v) => {
    if (Array.isArray(v)) return v.map(restore);
    if (v && typeof v === 'object') {
      const o = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, restore(x)]));
      if (typeof o._id === 'string' && 'email' in o && originalEmail.has(o._id)) o.email = originalEmail.get(o._id);
      return o;
    }
    return v;
  };
  return async function fetch(query, params = {}) {
    const usesLower = /lower\(email\)/.test(query);
    const tree = parse(query, { params });
    const value = await evaluate(tree, { dataset: usesLower ? lowered : published, params });
    const result = await value.get();
    return usesLower ? restore(result) : result;
  };
}
