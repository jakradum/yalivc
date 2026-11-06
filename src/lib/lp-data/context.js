// Per-call reference resolver for the Supabase path: loads referenced documents
// through the loader in batches and answers `->` lookups and `asset->url`.
import { getDocLoader } from './loader.js';
import { attr, isObj, byId } from './groq.js';
import { SANITY_CDN_IMAGES } from './rest.js';

// Collect `_ref` strings found anywhere inside the given values (asset refs included:
// an asset that does not exist resolves to null, like `asset->` in GROQ).
export function refsIn(values, out = new Set()) {
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (isObj(v)) {
      if (typeof v._ref === 'string') out.add(v._ref);
      for (const k of Object.keys(v)) walk(v[k]);
    }
  };
  walk(values);
  return out;
}

// image-<hash>-<W>x<H>-<ext> → https://cdn.sanity.io/images/<project>/<dataset>/<hash>-<W>x<H>.<ext>
export function imageUrlFromRef(ref) {
  const m = /^image-([A-Za-z0-9]+)-(\d+x\d+)-([a-z0-9]+)$/.exec(ref || '');
  return m ? `${SANITY_CDN_IMAGES}${m[1]}-${m[2]}.${m[3]}` : null;
}

export class Ctx {
  // fileBase: 'partners' or 'dataroom' — where PDF URLs point.
  constructor(fileBase) {
    this.loader = getDocLoader();
    this.fileBase = fileBase;
    this.docs = new Map();
  }

  async type(t) {
    const docs = await this.loader.byType(t);
    return byId((docs || []).filter((d) => isObj(d) && d._type === t));
  }

  // Load every reference inside `values` (and, `depth` levels down, inside the
  // documents found).
  async load(values, depth = 1) {
    let frontier = values;
    for (let level = 0; level < depth; level++) {
      const ids = [...refsIn(frontier)].filter((id) => !this.docs.has(id));
      if (!ids.length) return;
      const got = (await this.loader.byIds(ids)) || [];
      for (const id of ids) this.docs.set(id, null);
      for (const d of got) if (isObj(d) && ids.includes(d._id)) this.docs.set(d._id, d);
      frontier = got;
    }
  }

  // `x->`: the referenced document or null.
  deref(refObj) {
    const ref = attr(refObj, '_ref');
    if (typeof ref !== 'string') return null;
    return this.docs.get(ref) ?? null;
  }

  // `x.asset->url` given the `asset` reference value. Null when the asset document
  // does not exist (the loader returned nothing for it); otherwise images stay on
  // Sanity's CDN and files point at the session-checked file route.
  assetUrl(assetRef) {
    const ref = attr(assetRef, '_ref');
    if (typeof ref !== 'string' || !this.docs.get(ref)) return null;
    if (ref.startsWith('image-')) return imageUrlFromRef(ref);
    if (ref.startsWith('file-')) return `/${this.fileBase}/file/${ref}/`;
    return null;
  }

  // `x.asset->originalFilename`
  assetFilename(assetRef) {
    return attr(this.deref(assetRef), 'originalFilename');
  }
}
