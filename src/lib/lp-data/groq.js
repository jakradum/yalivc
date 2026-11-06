// Small helpers that reproduce the GROQ semantics the LP queries rely on, so the
// Supabase path returns exactly what Sanity returns. Verified against live Sanity
// (6 Nov 2026, read-only queries):
//   - `*[filter]` with no order comes back in _id order; `[0]` is the lowest _id.
//   - `order()` is a stable sort over that input. Value types rank
//     number < string < boolean < null/missing; `asc` puts null/missing last,
//     `desc` is the exact reverse (null/missing first), ties keep input order.
//   - array `| order()` is stable over the stored array order.
//   - strings compare by code point (not localeCompare).
//   - `null == null` is true; a missing attribute is null.
//   - a reference to a missing document, or `->` on a non-reference, is null.
//   - a projection of a missing field gives the key with null.

export const isNull = (v) => v === null || v === undefined;
export const defined = (v) => !isNull(v);
export const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Attribute access: a.b.c, null as soon as something is not an object.
export function attr(v, ...keys) {
  let cur = v;
  for (const k of keys) {
    if (!isObj(cur)) return null;
    cur = cur[k];
  }
  return cur === undefined ? null : cur;
}

// A raw field value as GROQ projects it (missing → null).
export const raw = (v) => (v === undefined ? null : v);

// GROQ `==` for the primitive comparisons these queries use.
export function eq(a, b) {
  if (isNull(a) && isNull(b)) return true;
  if (isNull(a) || isNull(b)) return false;
  return a === b;
}

// GROQ `in [...]` for a list of primitives.
export const inList = (v, list) => list.some((x) => eq(v, x));

// GROQ lower(): strings only, anything else → null.
export const lower = (v) => (typeof v === 'string' ? v.toLowerCase() : null);

// select(flag == true => null, value)
export const unlessTrue = (flag, value) => (flag === true ? null : raw(value));

// coalesce(a, b, ...)
export function coalesce(...vals) {
  for (const v of vals) if (defined(v)) return v;
  return null;
}

// Code-point string comparison.
const SURROGATE = /[\uD800-\uDFFF]/;
export function cmpStr(a, b) {
  if (!SURROGATE.test(a) && !SURROGATE.test(b)) return a < b ? -1 : a > b ? 1 : 0;
  const A = Array.from(a);
  const B = Array.from(b);
  const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i++) {
    const x = A[i].codePointAt(0);
    const y = B[i].codePointAt(0);
    if (x !== y) return x < y ? -1 : 1;
  }
  return A.length - B.length < 0 ? -1 : A.length > B.length ? 1 : 0;
}

function rank(v) {
  if (typeof v === 'number') return 1;
  if (typeof v === 'string') return 2;
  if (typeof v === 'boolean') return 3;
  return 4; // null, missing, objects, arrays
}

export function cmpValue(a, b) {
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra < rb ? -1 : 1;
  if (ra === 1) return a < b ? -1 : a > b ? 1 : 0;
  if (ra === 2) return cmpStr(a, b);
  if (ra === 3) return a === b ? 0 : a ? 1 : -1;
  return 0;
}

// order(k1 dir, k2 dir, ...): keys = [[fn, 'asc'|'desc'], ...]. Stable.
export function order(list, keys) {
  return list
    .map((x, i) => [x, i])
    .sort(([a, ia], [b, ib]) => {
      for (const [fn, dir] of keys) {
        let c = cmpValue(fn(a), fn(b));
        if (dir === 'desc') c = -c;
        if (c) return c;
      }
      return ia - ib;
    })
    .map(([x]) => x);
}

// Documents in the order an unordered `*[...]` returns them.
export const byId = (docs) => [...docs].sort((a, b) => cmpStr(String(a._id), String(b._id)));

// `arr[]` on a value: null unless it is an array.
export const arr = (v) => (Array.isArray(v) ? v : null);

// `arr[]{...}`: project each element; non-object elements become null.
export function mapProj(v, fn) {
  const a = arr(v);
  return a ? a.map((x) => (isObj(x) ? fn(x) : null)) : null;
}

// count(): arrays only, else null.
export const count = (v) => (Array.isArray(v) ? v.length : null);

// A GROQ parameter that was not provided makes Sanity reject the query; the
// Supabase path throws the same way so callers see the same failure.
export function needParam(name, value) {
  if (value === undefined) throw new Error(`param $${name} referenced, but not provided`);
  return value;
}
