// Shadow mode: after the response has gone out, run the Supabase version of a read,
// compare it with the Sanity result that was served, and record each differing JSON
// path in `parity_diffs` as HMAC-SHA256 hashes (keyed with PORTAL_AUTH_SECRET) of the
// two values, so short secrets such as invite codes cannot be brute-forced from the
// table. Never raw values, never logged; without the key nothing is recorded. If the
// table does not exist yet, the insert error is swallowed.
import crypto from 'crypto';
import { supa, SANITY_CDN_FILES } from './rest.js';
import { isObj } from './groq.js';

const MAX_ROWS = 200;
const hmacKey = () => process.env.PORTAL_AUTH_SECRET || null;
const sha = (s) => crypto.createHmac('sha256', hmacKey()).update(s).digest('hex');

// Stable JSON (sorted keys) so equal values hash equally.
export function stableJson(v) {
  if (Array.isArray(v)) return `[${v.map(stableJson).join(',')}]`;
  if (isObj(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stableJson(v[k])}`).join(',')}}`;
  return JSON.stringify(v === undefined ? null : v);
}
const hashValue = (v, present) => (present ? sha(stableJson(v)) : null);

// Two file URLs are the same file when they point at the same asset id:
//   https://cdn.sanity.io/files/<project>/<dataset>/<sha1>.<ext>  → file-<sha1>-<ext>
//   /partners/file/<assetId>/  or  /dataroom/file/<assetId>/  (optional ?dl=)  → <assetId>
const escapeRe = (str) => str.replace(/[.*+?^$()|[\]\\/{}]/g, (c) => `\\${c}`);
const SANITY_FILE = new RegExp(`^${escapeRe(SANITY_CDN_FILES)}([0-9a-f]+)\\.([a-z0-9]+)(\\?.*)?$`);
const ROUTE_FILE = /^\/(?:partners|dataroom)\/file\/(file-[0-9a-f]+-[a-z0-9]+)\/?(\?.*)?$/;
export function normaliseFileUrl(v) {
  if (typeof v !== 'string') return v;
  let m = SANITY_FILE.exec(v);
  if (m) return `asset:file-${m[1]}-${m[2]}${m[3] || ''}`;
  m = ROUTE_FILE.exec(v);
  if (m) return `asset:${m[1]}${m[2] || ''}`;
  return v;
}

// Deep, order-sensitive comparison; missing ≠ null. Returns [{ path, a, b, aHas, bHas }].
export function diff(a, b, path = '$', out = []) {
  if (out.length >= MAX_ROWS) return out;
  const na = normaliseFileUrl(a);
  const nb = normaliseFileUrl(b);
  if (Array.isArray(na) && Array.isArray(nb)) {
    const n = Math.max(na.length, nb.length);
    for (let i = 0; i < n; i++) {
      if (i >= na.length || i >= nb.length) out.push({ path: `${path}[${i}]`, a: na[i], b: nb[i], aHas: i < na.length, bHas: i < nb.length });
      else diff(na[i], nb[i], `${path}[${i}]`, out);
    }
    return out;
  }
  if (isObj(na) && isObj(nb)) {
    const keys = [...new Set([...Object.keys(na), ...Object.keys(nb)])].sort();
    for (const k of keys) {
      const aHas = Object.prototype.hasOwnProperty.call(na, k) && na[k] !== undefined;
      const bHas = Object.prototype.hasOwnProperty.call(nb, k) && nb[k] !== undefined;
      const p = /^[A-Za-z_$][\w$]*$/.test(k) ? `${path}.${k}` : `${path}[${JSON.stringify(k)}]`;
      if (aHas !== bHas) out.push({ path: p, a: na[k], b: nb[k], aHas, bHas });
      else if (aHas) diff(na[k], nb[k], p, out);
    }
    return out;
  }
  if (stableJson(na) !== stableJson(nb)) out.push({ path, a: na, b: nb, aHas: true, bHas: true });
  return out;
}

async function record(rows) {
  if (!rows.length) return;
  try {
    await supa('/rest/v1/parity_diffs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: rows });
  } catch {
    // parity_diffs not created yet (B2's migration 0002), or Supabase unavailable: ignore.
  }
}

export async function compareAndRecord(fn, args, sanityResult, runSupabase) {
  if (!hmacKey()) return; // no key, no hashes: record nothing rather than plain digests
  const inputHash = sha(stableJson(args));
  let supabaseResult;
  try {
    supabaseResult = await runSupabase();
  } catch (err) {
    await record([{ fn, input_hash: inputHash, path: '$', sanity_hash: hashValue(sanityResult, true), supabase_hash: null,
      note: `supabase error${err?.status ? ` ${err.status}` : ''}` }]);
    return;
  }
  const diffs = diff(sanityResult, supabaseResult);
  const rows = diffs.map((d) => ({
    fn,
    input_hash: inputHash,
    path: d.path,
    sanity_hash: hashValue(d.a, d.aHas),
    supabase_hash: hashValue(d.b, d.bHas),
    note: !d.aHas ? 'missing on sanity side' : !d.bHas ? 'missing on supabase side' : null,
  }));
  if (diffs.length >= MAX_ROWS) rows.push({ fn, input_hash: inputHash, path: '$', sanity_hash: null, supabase_hash: null, note: `truncated at ${MAX_ROWS} paths` });
  await record(rows);
}

// Run the comparison after the response (next/server `after`); outside a request
// (scripts), run it detached.
export async function scheduleShadow(fn, args, sanityResult, runSupabase) {
  const snapshot = sanityResult === undefined ? undefined : structuredClone(sanityResult);
  const task = () => compareAndRecord(fn, args, snapshot, runSupabase).catch(() => {});
  try {
    const { after } = await import('next/server');
    after(task);
  } catch {
    task();
  }
}
