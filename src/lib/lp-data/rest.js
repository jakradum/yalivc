// Server-only HTTP helpers for the Supabase twin (PostgREST, secret key) and for
// reading public Sanity types. Every request is uncached (`cache: 'no-store'`).
// Never log response bodies: they hold LP data.

const SANITY_PROJECT = 'nt0wmty3';
const SANITY_DATASET = 'production';
const SANITY_API = '2024-01-01';

export const enc = encodeURIComponent;

// Sanity ids, asset ids and types are plain tokens; anything else is never put in a URL.
const ID_RE = /^[A-Za-z0-9._-]+$/;
export const isSafeId = (id) => typeof id === 'string' && id.length > 0 && id.length < 200 && ID_RE.test(id);

function supaConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  return { url, key };
}

export class SupabaseError extends Error {
  constructor(method, table, status) {
    super(`Supabase ${method} ${table} → ${status}`);
    this.status = status;
  }
}

// path: '/rest/v1/<table>?<query>'. Returns { rows, res }.
export async function supa(path, { method = 'GET', body, headers = {} } = {}) {
  const { url, key } = supaConfig();
  const res = await fetch(`${url}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    await res.text().catch(() => {}); // drain; never surface the body
    throw new SupabaseError(method, path.split('?')[0].replace('/rest/v1/', ''), res.status);
  }
  const text = await res.text();
  return { rows: text ? JSON.parse(text) : null, res };
}

// GET every row of a table read, paging by key: `order=<key>.asc&limit=<pageSize>`,
// then `<key>=gt.<last key>` until a page comes back EMPTY. A short page is not the
// end: PostgREST's db-max-rows may be below pageSize. Keyset paging also cannot skip
// or repeat rows when other rows are inserted or deleted between page requests
// (offset paging can). `path` must select `key` and must not set order/limit/offset.
// `complete(rows)` may end the read early once the caller knows it has every row
// (e.g. all ids of an `in.(...)` filter found), saving the final empty request.
export async function supaAll(path, { key = 'id', pageSize = 1000, complete } = {}) {
  if (/[?&](order|limit|offset)=/.test(path)) throw new Error('supaAll: path must not set order, limit or offset');
  const sep = path.includes('?') ? '&' : '?';
  const out = [];
  let last;
  for (;;) {
    const after = last === undefined ? '' : `&${key}=gt.${enc(last)}`;
    const { rows } = await supa(`${path}${sep}order=${key}.asc&limit=${pageSize}${after}`);
    const page = rows || [];
    if (!page.length) return out;
    const next = page[page.length - 1]?.[key];
    if (typeof next !== 'string' || next === last) throw new Error(`supaAll: page rows lack an increasing "${key}"`);
    out.push(...page);
    if (complete?.(out)) return out;
    last = next;
  }
}

// Read-only GROQ against Sanity (published perspective, read token).
export async function sanityQuery(query, params = {}) {
  const token = process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN;
  const u = `https://${SANITY_PROJECT}.api.sanity.io/v${SANITY_API}/data/query/${SANITY_DATASET}?perspective=published`;
  const res = await fetch(u, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, params }),
  });
  if (!res.ok) {
    await res.text().catch(() => {});
    throw new Error(`Sanity query → ${res.status}`);
  }
  return (await res.json()).result;
}

export const SANITY_CDN_IMAGES = `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}/`;
export const SANITY_CDN_FILES = `https://cdn.sanity.io/files/${SANITY_PROJECT}/${SANITY_DATASET}/`;
