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

// GET every row, paging past PostgREST's 1,000-row cap with Range headers.
export async function supaAll(path, pageSize = 1000) {
  const out = [];
  for (let from = 0; ; from += pageSize) {
    const { rows } = await supa(path, { headers: { Range: `${from}-${from + pageSize - 1}`, 'Range-Unit': 'items' } });
    const page = rows || [];
    out.push(...page);
    if (page.length < pageSize) return out;
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
