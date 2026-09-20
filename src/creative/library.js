// The asset library: pictures a person has uploaded for an asset to use.
// It lives INSIDE the asset (`doc.assets`, keyed by asset id) so a downloaded
// asset is self-contained. Each entry carries the metadata the guardrails
// need — what it is, its alt text, and how it may be used.
//
//   { url, width, height, kind: 'photo'|'logo'|'graphic', alt, description?,
//     noCrop?: bool, ground?: 'light'|'dark'|'any' (logos), people?: bool }
//
// The URL must be on the brand's Sanity asset prefix; the AI never sees or
// writes a URL — it refers to an asset by id, and alt text comes from here.
export const ASSET_KINDS = ['photo', 'logo', 'graphic'];
export const GROUNDS = ['light', 'dark', 'any'];
export const MAX_ASSETS = 20;
const ASSET_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{2,90}$/;

// Returns a list of problems ([] = fine). `prefix` = brand.images.sanityPrefix.
export function libraryProblems(assets, prefix) {
  const out = [];
  if (assets === undefined) return out;
  if (!assets || typeof assets !== 'object' || Array.isArray(assets)) return ['assets must be an object keyed by asset id'];
  const ids = Object.keys(assets);
  if (ids.length > MAX_ASSETS) out.push(`at most ${MAX_ASSETS} uploaded assets`);
  for (const id of ids) {
    const a = assets[id];
    const at = `assets.${id}`;
    if (!ASSET_ID.test(id)) out.push(`${at}: bad asset id`);
    if (!a || typeof a !== 'object') {
      out.push(`${at}: must be an object`);
      continue;
    }
    if (typeof a.url !== 'string' || !a.url.startsWith(prefix)) out.push(`${at}.url: must be a Sanity asset URL (${prefix}…)`);
    for (const k of ['width', 'height']) if (!Number.isInteger(a[k]) || a[k] < 1 || a[k] > 20000) out.push(`${at}.${k}: must be an integer 1–20000`);
    if (!ASSET_KINDS.includes(a.kind)) out.push(`${at}.kind: must be one of ${ASSET_KINDS.join(', ')}`);
    if (typeof a.alt !== 'string' || !a.alt.trim() || a.alt.length > 160) out.push(`${at}.alt: alt text is required (≤160 chars)`);
    if (a.description !== undefined && (typeof a.description !== 'string' || a.description.length > 300)) out.push(`${at}.description: text ≤300 chars`);
    for (const k of ['noCrop', 'people']) if (a[k] !== undefined && typeof a[k] !== 'boolean') out.push(`${at}.${k}: must be true or false`);
    if (a.ground !== undefined && !GROUNDS.includes(a.ground)) out.push(`${at}.ground: must be one of ${GROUNDS.join(', ')}`);
    for (const k of Object.keys(a)) if (!['url', 'width', 'height', 'kind', 'alt', 'description', 'noCrop', 'ground', 'people'].includes(k)) out.push(`${at}.${k}: unknown field`);
  }
  return out;
}

// For the API: keep only well-formed entries from client-supplied data and
// rebuild each from known fields, so nothing unvetted rides along.
export function cleanLibrary(raw, prefix) {
  const clean = {};
  if (!raw || typeof raw !== 'object') return clean;
  for (const [id, a] of Object.entries(raw).slice(0, MAX_ASSETS)) {
    const candidate = { url: a?.url, width: a?.width, height: a?.height, kind: a?.kind, alt: a?.alt, description: a?.description, noCrop: a?.noCrop, ground: a?.ground, people: a?.people };
    for (const k of Object.keys(candidate)) if (candidate[k] === undefined || candidate[k] === null) delete candidate[k];
    if (libraryProblems({ [id]: candidate }, prefix).length === 0) clean[id] = candidate;
  }
  return clean;
}

// The image URL to actually load: a width-limited, auto-format Sanity CDN
// rendition (keeps previews and emails light; transparency is preserved).
export const renditionUrl = (asset, maxW) => `${asset.url}?w=${Math.min(asset.width, maxW)}&auto=format&fit=max`;

// Crop fraction when an image of (w×h) fills a box of `ratio` (w/h) with
// object-fit: cover — the share of the picture that is cut away.
export const cropFraction = (w, h, ratio) => {
  const nat = w / h;
  return 1 - Math.min(nat / ratio, ratio / nat);
};
