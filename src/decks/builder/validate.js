import { OPTIONAL_PROPS } from './catalog';

// Prop overrides are the only free-text an editor (or Claude) can inject,
// so they're checked against the shape the slide's own builder produces:
// same keys, same JSON types, bounded sizes, and nothing that could point
// an <img>/<a> somewhere else.
const URLISH = /(url|src|href|link|photo|logo|image)/i;
const MAX_STR = 600;
const MAX_ARR = 40;

const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

// One sample per array: merge the keys of every element so optional keys
// that only some rows carry are still allowed.
function sampleOf(arr) {
  if (!arr.length) return undefined;
  if (kind(arr[0]) !== 'object') return arr[0];
  const merged = {};
  for (const el of arr) for (const [k, v] of Object.entries(el || {})) if (!(k in merged)) merged[k] = v;
  return merged;
}

function check(ref, val, path) {
  const rk = kind(ref);
  const vk = kind(val);
  if (rk === 'array') {
    if (vk !== 'array') throw new Error(`${path}: expected a list`);
    if (val.length > MAX_ARR) throw new Error(`${path}: too many items (max ${MAX_ARR})`);
    const sample = sampleOf(ref);
    val.forEach((el, i) => check(sample === undefined ? '' : sample, el, `${path}[${i}]`));
    return;
  }
  if (rk === 'object') {
    if (vk !== 'object') throw new Error(`${path}: expected an object`);
    for (const [k, v] of Object.entries(val)) {
      if (URLISH.test(k)) throw new Error(`${path}.${k}: image/link fields can't be edited`);
      if (!(k in ref)) throw new Error(`${path}.${k}: not a field of this slide`);
      check(ref[k], v, `${path}.${k}`);
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
  for (const [key, val] of Object.entries(overrides)) {
    if (URLISH.test(key)) throw new Error(`${key}: image/link fields can't be edited`);
    if (key in base) {
      check(base[key], val, key);
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
