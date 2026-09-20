import { OPTIONAL_PROPS } from './catalog';

// Prop overrides are the only free-text an editor (or Claude) can inject,
// so they're checked against the shape the slide's own builder produces:
// same keys, same JSON types, bounded sizes, and nothing that could point
// an <img>/<a> somewhere else.
const URLISH = /(url|src|href|link|photo|logo|image)/i;
const MAX_STR = 600;
const MAX_ARR = 40;

// URL-ish values already present in the built props (logos, photos, links).
// A list edit re-sends whole items, so these may appear again — but only
// with a value that already exists; a new one is always rejected.
function collectUrls(v, out = new Set()) {
  if (Array.isArray(v)) v.forEach((x) => collectUrls(x, out));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (URLISH.test(k) && typeof x === 'string') out.add(x);
      else collectUrls(x, out);
    }
  }
  return out;
}

const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

// One sample per array: merge the keys of every element so optional keys
// that only some rows carry are still allowed.
function sampleOf(arr) {
  if (!arr.length) return undefined;
  if (kind(arr[0]) !== 'object') return arr[0];
  const merged = {};
  // First value wins per key — except an empty list, which says nothing
  // about item shape, so a later non-empty list replaces it.
  for (const el of arr) {
    for (const [k, v] of Object.entries(el || {})) {
      const emptyList = Array.isArray(merged[k]) && merged[k].length === 0;
      if (!(k in merged) || (emptyList && Array.isArray(v) && v.length)) merged[k] = v;
    }
  }
  return merged;
}

function check(ref, val, path, urls) {
  const rk = kind(ref);
  const vk = kind(val);
  if (rk === 'array') {
    if (vk !== 'array') throw new Error(`${path}: expected a list`);
    if (val.length > MAX_ARR) throw new Error(`${path}: too many items (max ${MAX_ARR})`);
    const sample = sampleOf(ref);
    val.forEach((el, i) => check(sample === undefined ? '' : sample, el, `${path}[${i}]`, urls));
    return;
  }
  if (rk === 'object') {
    if (vk !== 'object') throw new Error(`${path}: expected an object`);
    for (const [k, v] of Object.entries(val)) {
      if (!(k in ref)) throw new Error(`${path}.${k}: not a field of this slide`);
      if (URLISH.test(k)) {
        if (v !== null && !urls.has(v)) throw new Error(`${path}.${k}: image/link fields can't be edited`);
        continue;
      }
      check(ref[k], v, `${path}.${k}`, urls);
    }
    return;
  }
  if (rk === 'string' || rk === 'null' || rk === 'undefined') {
    if (vk !== 'string') throw new Error(`${path}: expected text`);
    if (val.length > MAX_STR) throw new Error(`${path}: too long (max ${MAX_STR} chars)`);
    return;
  }
  if (vk !== rk) throw new Error(`${path}: expected ${rk}`);
}

// base = the slide's built props (before overrides).
export function validateOverrides(type, base, overrides) {
  if (kind(overrides) !== 'object') throw new Error('props must be an object');
  const optional = OPTIONAL_PROPS[type] || {};
  const urls = collectUrls(base);
  for (const [key, val] of Object.entries(overrides)) {
    if (URLISH.test(key)) {
      if (!(key in base) || val !== base[key]) throw new Error(`${key}: image/link fields can't be edited`);
      continue;
    }
    if (key in base) {
      check(base[key], val, key, urls);
    } else if (optional[key]) {
      if (typeof val !== optional[key]) throw new Error(`${key}: expected ${optional[key]}`);
      if (typeof val === 'string' && val.length > MAX_STR) throw new Error(`${key}: too long`);
    } else {
      throw new Error(`${key}: not an editable field of a "${type}" slide (editable: ${[...Object.keys(base), ...Object.keys(optional)].join(', ') || 'none'})`);
    }
  }
  if (type === 'section-divider' && 'pattern' in overrides) {
    const p = overrides.pattern;
    if (!Number.isInteger(p) || p < 1 || p > 7) throw new Error('pattern must be an integer 1–7');
  }
}
