import { FORMATS } from './formats.js';
import { getBrand } from './brands/index.js';
import { BLOCKS, LAYER_CHILD_PROPS, TEXT_ROLES } from './blocks.js';
import { contrast } from './contrast.js';

// validateAsset(doc) → { ok, errors: [{ path, msg }], warnings: [...] }
//
// What is enforced BY CONSTRUCTION (the schema can't express it):
//   free colours · font sizes/families · pixel positions · unsafe margins.
// What is enforced HERE:
//   structure & nesting · known blocks/props · value types & enums · text
//   length per role · AA contrast on the real background · image sources +
//   alt text · link hosts · provenance on numbers · per-format rules (email).
// Still checked at RENDER time, not here: text overflowing a fixed canvas.

const MAX_BLOCKS_PER_PAGE = 40;
const MAX_DEPTH = 6;
const ID_RE = /^[a-z0-9][a-z0-9-_]{0,40}$/i;

export function validateAsset(doc) {
  const errors = [];
  const warnings = [];
  const err = (path, msg) => errors.push({ path, msg });
  const warn = (path, msg) => warnings.push({ path, msg });

  if (!doc || typeof doc !== 'object') return { ok: false, errors: [{ path: '', msg: 'Asset must be an object' }], warnings };
  if (doc.schema !== 'creative/1') err('schema', 'schema must be "creative/1"');
  const format = FORMATS[doc.format];
  const brand = getBrand(doc.brand);
  if (!format) err('format', `Unknown format "${doc.format}". Options: ${Object.keys(FORMATS).join(', ')}`);
  if (!brand) err('brand', `Unknown brand "${doc.brand}"`);
  if (typeof doc.title !== 'string' || !doc.title.trim()) err('title', 'title is required');
  if (!Array.isArray(doc.pages)) {
    err('pages', 'pages must be a list');
    return { ok: false, errors, warnings };
  }
  if (!format || !brand) return { ok: false, errors, warnings };

  if (doc.pages.length < format.minPages || doc.pages.length > format.maxPages) {
    err('pages', `${format.label} needs ${format.minPages}–${format.maxPages} page(s); has ${doc.pages.length}`);
  }

  const colorNames = Object.keys(brand.colors);
  const spaceNames = Object.keys(brand.space);
  const radiusNames = Object.keys(brand.radius);
  const ids = new Set();
  const isEmail = format.kind === 'email';

  const checkProp = (path, name, def, val) => {
    const at = `${path}.${name}`;
    switch (def.t) {
      case 'enum':
        if (!def.values.includes(val)) err(at, `must be one of ${def.values.join(', ')} (got ${JSON.stringify(val)})`);
        break;
      case 'color':
        if (!colorNames.includes(val)) err(at, `"${val}" is not a brand colour. Use: ${colorNames.join(', ')}`);
        break;
      case 'space':
        if (!spaceNames.includes(val)) err(at, `"${val}" is not a spacing step. Use: ${spaceNames.join(', ')}`);
        break;
      case 'radius':
        if (!radiusNames.includes(val)) err(at, `"${val}" is not a radius. Use: ${radiusNames.join(', ')}`);
        break;
      case 'str':
        if (typeof val !== 'string') err(at, 'must be text');
        else if (val.length > def.max) err(at, `too long (${val.length}/${def.max} chars)`);
        break;
      case 'int':
        if (!Number.isInteger(val) || val < def.min || val > def.max) err(at, `must be an integer ${def.min}–${def.max}`);
        break;
      case 'bool':
        if (typeof val !== 'boolean') err(at, 'must be true or false');
        break;
      case 'ref': {
        const ok =
          val &&
          ((val.kind === 'sanity' && typeof val.url === 'string' && val.url.startsWith(brand.images.sanityPrefix)) ||
            (val.kind === 'library' && brand.images.library[val.key]));
        if (!ok) err(at, `image must be {kind:"sanity", url starting ${brand.images.sanityPrefix}} or {kind:"library", key: ${Object.keys(brand.images.library).join('|')}}`);
        break;
      }
      case 'url': {
        try {
          const u = new URL(val);
          if (u.protocol !== 'https:') err(at, 'links must be https');
          else if (!brand.linkHosts.includes(u.hostname)) err(at, `link host "${u.hostname}" is not allowed (${brand.linkHosts.join(', ')})`);
        } catch {
          err(at, 'must be a valid https URL');
        }
        break;
      }
      case 'strs':
        if (!Array.isArray(val) || !val.length) err(at, 'must be a non-empty list of text');
        else {
          if (val.length > def.maxItems) err(at, `max ${def.maxItems} items`);
          val.forEach((v, i) => {
            if (typeof v !== 'string' || !v.trim()) err(`${at}[${i}]`, 'must be non-empty text');
            else if (v.length > def.maxLen) err(`${at}[${i}]`, `too long (${v.length}/${def.maxLen})`);
          });
        }
        break;
      default:
    }
  };

  // bg = effective background colour NAME behind this block.
  const walk = (block, path, ctx) => {
    if (!block || typeof block !== 'object') return err(path, 'block must be an object');
    const def = BLOCKS[block.type];
    if (!def) return err(path, `unknown block type "${block.type}". Use: ${Object.keys(BLOCKS).join(', ')}`);
    if (!format.blocks.includes(block.type)) return err(path, `"${block.type}" is not available in ${format.label}`);
    if (typeof block.id !== 'string' || !ID_RE.test(block.id)) err(`${path}.id`, 'id is required (letters, digits, - _)');
    else if (ids.has(block.id)) err(`${path}.id`, `duplicate id "${block.id}"`);
    else ids.add(block.id);
    ctx.count.n += 1;
    if (ctx.count.n > MAX_BLOCKS_PER_PAGE) {
      if (ctx.count.n === MAX_BLOCKS_PER_PAGE + 1) err(path, `too many blocks on one page (max ${MAX_BLOCKS_PER_PAGE})`);
      return null;
    }
    if (ctx.depth > (format.maxDepth || MAX_DEPTH)) return err(path, `nested too deeply (max ${format.maxDepth || MAX_DEPTH})`);

    const allowed = { ...def.props, ...(ctx.inLayer ? LAYER_CHILD_PROPS : {}) };
    for (const k of Object.keys(block)) {
      if (['type', 'id', 'children'].includes(k)) continue;
      if (!allowed[k]) err(`${path}.${k}`, `"${k}" is not a prop of ${block.type}${ctx.inLayer ? '' : ' (anchor/inset only apply inside a layer)'}`);
    }
    for (const [k, p] of Object.entries(allowed)) {
      if (block[k] === undefined) {
        if (p.required) err(`${path}.${k}`, 'required');
        continue;
      }
      checkProp(path, k, p, block[k]);
    }
    if (ctx.inLayer && block.anchor === undefined) warn(path, 'no anchor set (defaults to fill)');

    // per-block rules
    let bg = ctx.bg;
    if (block.type === 'stack' || block.type === 'grid' || block.type === 'layer') {
      if (block.fill && colorNames.includes(block.fill)) bg = block.fill;
      if (block.type === 'grid' && isEmail && block.columns > format.maxGridColumns) err(`${path}.columns`, `email allows at most ${format.maxGridColumns} columns`);
      if (!Array.isArray(block.children)) err(`${path}.children`, 'containers need a children list');
      else block.children.forEach((c, i) => walk(c, `${path}.children[${i}]`, { ...ctx, bg, depth: ctx.depth + 1, inLayer: block.type === 'layer' }));
    } else if (block.children !== undefined) {
      err(`${path}.children`, `${block.type} cannot have children`);
    }

    if (block.type === 'text' && TEXT_ROLES[block.role] !== undefined) {
      if (typeof block.text === 'string' && block.text.length > TEXT_ROLES[block.role]) err(`${path}.text`, `too long for role "${block.role}" (${block.text.length}/${TEXT_ROLES[block.role]} chars)`);
      contrastCheck(path, block.color, bg, brand.type[block.role]?.large, ctx.overImage);
    }
    if (block.type === 'stat') contrastCheck(path, block.color || 'crimson', bg, true, ctx.overImage);
    if (block.type === 'list') contrastCheck(path, block.color, bg, false, ctx.overImage);
    if (block.type === 'stat' && typeof block.source === 'string' && !(block.source === 'user' || /^sanity:[\w.-]+$/.test(block.source))) {
      err(`${path}.source`, 'must be "user" or "sanity:<doc>.<field>" — numbers need provenance');
    }
    if (block.type === 'image' && !block.decorative && !(typeof block.alt === 'string' && block.alt.trim())) err(`${path}.alt`, 'alt text is required (or set decorative: true)');
    if (block.type === 'image' && isEmail && block.ratio === undefined) warn(path, 'email images should set a ratio');
    if (block.type === 'logo' && isEmail && (block.variant !== 'lockup' || block.tone === 'dark')) {
      err(path, 'email logos must be variant "lockup" on a light ground (SVG marks and white logos have no hosted PNG yet)');
    }
    if (block.type === 'pattern' && !ctx.inLayer) err(path, 'pattern must be a direct child of a layer');
    if (block.type === 'shape' && block.kind === 'scrim' && !ctx.inLayer) err(path, 'a scrim only makes sense inside a layer');
    return null;
  };

  function contrastCheck(path, colorName, bgName, large, overImage) {
    if (!colorName || !bgName || !brand.colors[colorName] || !brand.colors[bgName]) return;
    const ratio = contrast(brand.colors[colorName], brand.colors[bgName]);
    const need = large ? 3 : 4.5;
    if (ratio < need) err(`${path}.color`, `"${colorName}" on "${bgName}" has contrast ${ratio.toFixed(1)}:1 — needs ${need}:1. Pick a colour that reads on ${bgName}.`);
    if (overImage) warn(path, 'text over an image: add a scrim so it stays legible');
  }

  const pageIds = new Set();
  doc.pages.forEach((page, i) => {
    const path = `pages[${i}]`;
    if (typeof page.id !== 'string' || !ID_RE.test(page.id)) err(`${path}.id`, 'page id is required');
    else if (pageIds.has(page.id)) err(`${path}.id`, `duplicate page id "${page.id}"`);
    else pageIds.add(page.id);
    if (!colorNames.includes(page.background)) return err(`${path}.background`, `must be a brand colour: ${colorNames.join(', ')}`);
    const root = page.root;
    if (!root || root.type !== 'stack') return err(`${path}.root`, 'each page needs a root of type "stack"');
    if (isEmail && (root.direction || 'column') !== 'column') err(`${path}.root.direction`, 'email root must be a column');
    const count = { n: 0 };
    walk(root, `${path}.root`, { bg: page.background, depth: 1, count, inLayer: false });
    // an image + text in the same layer without a scrim → legibility warning
    const scan = (b, p) => {
      if (b.type === 'layer' && Array.isArray(b.children)) {
        const hasImg = b.children.some((c) => c.type === 'image');
        const hasScrim = b.children.some((c) => c.type === 'shape' && c.kind === 'scrim');
        const hasText = b.children.some((c) => c.type === 'text' || c.type === 'stat');
        if (hasImg && hasText && !hasScrim) warn(p, 'text over an image without a scrim');
      }
      (b.children || []).forEach((c, j) => scan(c, `${p}.children[${j}]`));
    };
    scan(root, `${path}.root`);
  });

  return { ok: errors.length === 0, errors, warnings };
}

export const formatErrors = (r) => r.errors.map((e) => `${e.path || '(asset)'}: ${e.msg}`).join('\n');
