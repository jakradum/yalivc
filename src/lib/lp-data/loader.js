// The document loader: the only way the Supabase path reads documents.
//
//   loader = {
//     byType: async (type) => Doc[],  // all published docs of a type
//     byIds:  async (ids)  => Doc[],  // docs by _id, any type; missing ids omitted
//   }
//
// Default loader:
//   - private types come from `sanity_docs` (PostgREST, secret key, keyset-paged by id).
//   - public types (PUBLIC_TYPES) come from Sanity, published perspective.
//   - file assets (`file-<sha1>-<ext>` ids) come from `sanity_files` and are returned
//     as { _id, _type: 'sanity.fileAsset', originalFilename, mimeType, size }. A file
//     ref with no row there resolves to null, like a deleted asset in Sanity.
//   - image assets (`image-…` ids) are `sanity.imageAsset` docs from Sanity; only
//     their existence matters (the URL is built from the ref).
// Nothing is cached: every call reads fresh.
// Tests replace it with fixtures via setDocLoader(); a fixture loader returns file
// asset docs from byIds the same way.
import { supaAll, sanityQuery, enc, isSafeId } from './rest.js';
import { byId } from './groq.js';

export const PUBLIC_TYPES = new Set(['category', 'teamMember', 'publication', 'news', 'socialUpdate', 'sanity.imageAsset']);

const CHUNK = 100;
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const inFilter = (ids) => `in.(${ids.map((id) => `"${enc(id)}"`).join(',')})`;

async function twinByType(type) {
  const rows = await supaAll(`/rest/v1/sanity_docs?select=id,doc&type=eq.${enc(type)}`);
  return rows.map((r) => r.doc);
}

export const defaultLoader = {
  async byType(type) {
    if (!isSafeId(type)) return [];
    if (PUBLIC_TYPES.has(type)) return byId(await sanityQuery('*[_type == $type]', { type }));
    return twinByType(type);
  },

  async byIds(ids) {
    const want = [...new Set(ids)].filter(isSafeId);
    const fileIds = want.filter((id) => id.startsWith('file-'));
    const imageIds = want.filter((id) => id.startsWith('image-'));
    const docIds = want.filter((id) => !id.startsWith('file-') && !id.startsWith('image-'));
    const out = [];

    for (const part of chunk(fileIds, CHUNK)) {
      const rows = await supaAll(`/rest/v1/sanity_files?select=asset_id,original_filename,mime_type,size_bytes&asset_id=${inFilter(part)}`,
        { key: 'asset_id', complete: (got) => got.length >= part.length });
      for (const r of rows) {
        out.push({ _id: r.asset_id, _type: 'sanity.fileAsset', originalFilename: r.original_filename ?? null, mimeType: r.mime_type ?? null, size: r.size_bytes ?? null });
      }
    }

    const found = new Set();
    for (const part of chunk(docIds, CHUNK)) {
      const rows = await supaAll(`/rest/v1/sanity_docs?select=id,doc&id=${inFilter(part)}`, { complete: (got) => got.length >= part.length });
      for (const r of rows) { out.push(r.doc); found.add(r.doc._id); }
    }

    const rest = [...imageIds, ...docIds.filter((id) => !found.has(id))];
    if (rest.length) {
      const docs = await sanityQuery('*[_id in $ids]', { ids: rest });
      for (const d of docs || []) {
        if (PUBLIC_TYPES.has(d._type)) out.push(d);
      }
    }
    return out;
  },
};

let current = defaultLoader;

export function setDocLoader(loader) {
  if (!loader || typeof loader.byType !== 'function' || typeof loader.byIds !== 'function') {
    throw new Error('setDocLoader: loader needs byType(type) and byIds(ids)');
  }
  current = loader;
}

export function resetDocLoader() {
  current = defaultLoader;
}

export const getDocLoader = () => current;
