import { FORMATS, formatScale } from './formats.js';
import { getBrand } from './brands/index.js';
import { BLOCKS, LAYER_CHILD_PROPS, TEXT_ROLES } from './blocks.js';
import { contrast, luminance } from './contrast.js';
import { libraryProblems, cropFraction } from './library.js';
import { estimateHeight, makeEnv } from './measure.js';

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
// Performance / return claims are regulated territory for a fund. If one comes
// from the person's own words (not a Sanity field) it's allowed but flagged.
const PERFORMANCE = /\b(returns?|returned|moic|irr|tvpi|dpi|multiple|aum|growth|grew|performance|profit|gains?|yield)\b/i;
// House rule (docs/CLAUDE.md): no em dashes in any visible text.
const EM_DASH = /—/;
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

  for (const msg of libraryProblems(doc.assets, brand.images.sanityPrefix)) err('assets', msg);
  const library = doc.assets && typeof doc.assets === 'object' ? doc.assets : {};
  const RATIO_VALUE = { '1:1': 1, '4:5': 0.8, '16:9': 16 / 9, '3:2': 1.5, '3:4': 0.75 };
  const isDark = (colorName) => brand.colors[colorName] && luminance(brand.colors[colorName]) < 0.2;

  const colorNames = Object.keys(brand.colors);
  const spaceNames = Object.keys(brand.space);
  const radiusNames = Object.keys(brand.radius);
  const ids = new Set();
  const isEmail = format.kind === 'email';
  const scale = isEmail ? 1 : formatScale(format);
  const mode = isEmail ? 'email' : 'canvas';
  const sp = (k) => (brand.space[k || 'none']?.[mode] ?? 0) * scale;
  // Rough advance width per character, in em. Estimates only — but reliable enough
  // to catch a long word in a narrow cell, which is the failure that actually happens.
  const CHAR = { mono: 0.6, body: 0.52 };
  const fontPx = (role) => {
    const t = brand.type[role];
    return t ? { size: isEmail ? t.email : t.size * scale, k: CHAR[t.font] } : null;
  };
  const fit = (path, word, role, ctx, what) => {
    const f = fontPx(role);
    if (!f || !ctx.width) return;
    const need = word.length * f.k * f.size;
    if (need <= ctx.width * 1.02) return;
    const msg = `${what} "${word.length > 24 ? `${word.slice(0, 22)}…` : word}" needs ~${Math.round(need)}px at role "${role}" but its cell is ~${Math.round(ctx.width)}px wide — use a smaller role or fewer columns`;
    if (ctx.exact) err(path, msg);
    else warn(path, msg);
  };
  const longest = (text) => String(text).replace(/==/g, '').split(/\s+/).reduce((a, w) => (w.length > a.length ? w : a), '');

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
          ((val.kind === 'upload' && typeof val.id === 'string' && library[val.id]) ||
            (val.kind === 'sanity' && typeof val.url === 'string' && val.url.startsWith(brand.images.sanityPrefix)) ||
            (val.kind === 'library' && brand.images.library[val.key]));
        if (!ok && val?.kind === 'upload') err(at, `no uploaded asset "${val.id}". Uploaded assets: ${Object.keys(library).join(', ') || '(none)'}`);
        else if (!ok) err(at, `image must be {kind:"upload", id: <uploaded asset id>}, {kind:"library", key: ${Object.keys(brand.images.library).join('|')}}, or a Sanity asset URL under ${brand.images.sanityPrefix}`);
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
    const visible = [block.text, block.label, block.value, ...(Array.isArray(block.items) ? block.items : [])].filter((x) => typeof x === 'string');
    if (visible.some((x) => EM_DASH.test(x))) err(path, 'no em dashes in visible text: use a colon, comma or semicolon instead');
    let bg = ctx.bg;
    if (block.type === 'stack' || block.type === 'grid' || block.type === 'layer') {
      if (block.fill && colorNames.includes(block.fill)) bg = block.fill;
      if (block.type === 'grid' && isEmail && block.columns > format.maxGridColumns) err(`${path}.columns`, `email allows at most ${format.maxGridColumns} columns`);
      if (!Array.isArray(block.children)) err(`${path}.children`, 'containers need a children list');
      else {
        const pad = block.type === 'layer' ? 0 : sp(block.padding);
        const gap = block.type === 'layer' ? 0 : sp(block.gap ?? 'm');
        const n = Math.max(block.children.length, 1);
        let cw = ctx.width - pad * 2;
        let exact = ctx.exact;
        if (block.type === 'grid' && Number.isInteger(block.columns)) cw = (cw - gap * (block.columns - 1)) / block.columns;
        else if (block.type === 'stack' && block.direction === 'row') {
          cw = (cw - gap * (n - 1)) / n;
          exact = false; // unequal children are normal in a row; only warn
        }
        // Inside a layer the real background is whatever sits behind the text:
        // a scrim of at least half opacity (its colour), a picture (unknown —
        // legibility is then the scrim rule's job), else the layer/page colour.
        let childBg = bg;
        if (block.type === 'layer') {
          const scrim = block.children.find((c) => c.type === 'shape' && (c.kind === 'scrim' || c.kind === 'fade') && brand.colors[c.color]);
          if (scrim && (scrim.opacity ?? 0.5) >= 0.5) childBg = scrim.color;
          else if (block.children.some((c) => c.type === 'image')) childBg = null;
        }
        block.children.forEach((c, i) => walk(c, `${path}.children[${i}]`, { ...ctx, bg: childBg, width: cw, exact, depth: ctx.depth + 1, inLayer: block.type === 'layer' }));
      }
    } else if (block.children !== undefined) {
      err(`${path}.children`, `${block.type} cannot have children`);
    }

    if (block.type === 'text' && TEXT_ROLES[block.role] !== undefined) {
      if (typeof block.text === 'string' && block.text.length > TEXT_ROLES[block.role]) err(`${path}.text`, `too long for role "${block.role}" (${block.text.length}/${TEXT_ROLES[block.role]} chars)`);
      contrastCheck(path, block.color, bg, brand.type[block.role]?.large, ctx.overImage);
      fit(`${path}.text`, longest(block.text || ''), block.role, ctx, 'the word');
    }
    if (block.type === 'stat' && typeof block.value === 'string') fit(`${path}.value`, block.value, block.size === 'medium' ? 'figure' : 'stat', ctx, 'the figure');
    if (block.type === 'list' && Array.isArray(block.items)) block.items.forEach((it, i) => fit(`${path}.items[${i}]`, longest(it), block.role || 'body', ctx, 'the word'));
    if (block.type === 'stat') contrastCheck(path, block.color || 'crimson', bg, true, ctx.overImage);
    if (block.type === 'list') contrastCheck(path, block.color, bg, false, ctx.overImage);
    if (block.type === 'stat' && typeof block.source === 'string' && !(block.source === 'user' || /^sanity:[\w.-]+$/.test(block.source))) {
      err(`${path}.source`, 'must be "user" or "sanity:<doc>.<field>" — numbers need provenance');
    }
    if (block.type === 'stat' && block.source === 'user' && PERFORMANCE.test(`${block.label} ${block.value}`)) {
      warn(path, 'performance/return figure supplied by the user, not read from Sanity — verify it against the LP report before publishing');
    }
    if (block.type === 'text' && /\d/.test(block.text || '') && PERFORMANCE.test(block.text || '')) {
      warn(path, 'text states a figure about returns or performance — confirm it is sourced before publishing');
    }
    if (block.type === 'image' && !block.decorative && block.src?.kind !== 'upload' && !(typeof block.alt === 'string' && block.alt.trim())) err(`${path}.alt`, 'alt text is required (or set decorative: true)');
    if (block.type === 'image' && block.src?.kind === 'upload' && library[block.src.id]) {
      const a = library[block.src.id];
      const fitUsed = block.fit || 'cover';
      // How an uploaded picture may be used — enforced, not just advised.
      if (a.kind === 'logo') {
        if (fitUsed !== 'contain') err(`${path}.fit`, `"${block.src.id}" is a logo: use fit "contain" (a logo is never cropped)`);
        if (block.tone === 'grayscale') err(`${path}.tone`, 'a logo must not be recoloured (no grayscale)');
        if (a.ground === 'light' && isDark(ctx.bg)) err(`${path}`, `this logo is marked for light grounds but sits on "${ctx.bg}"`);
        if (a.ground === 'dark' && ctx.bg && !isDark(ctx.bg)) err(`${path}`, `this logo is marked for dark grounds but sits on "${ctx.bg}"`);
      }
      if (a.noCrop && fitUsed !== 'contain') err(`${path}.fit`, `"${block.src.id}" is marked do-not-crop: use fit "contain"`);
      if (fitUsed === 'cover' && !ctx.inLayer) {
        const crop = cropFraction(a.width, a.height, RATIO_VALUE[block.ratio || '3:2']);
        if (crop > 0.6) err(`${path}.ratio`, `ratio ${block.ratio || '3:2'} would cut away ${Math.round(crop * 100)}% of this ${a.width}×${a.height} picture — choose a ratio close to ${(a.width / a.height).toFixed(2)}:1 or use fit "contain"`);
        else if (crop > 0.35) warn(`${path}.ratio`, `ratio ${block.ratio || '3:2'} crops ${Math.round(crop * 100)}% of the picture`);
      }
      if (ctx.width && a.width < ctx.width * 0.75 && a.kind !== 'logo') warn(`${path}`, `low resolution: ${a.width}px wide, shown ~${Math.round(ctx.width)}px wide`);
    }
    if (block.type === 'image' && isEmail && block.ratio === undefined) warn(path, 'email images should set a ratio');
    if (block.type === 'logo' && isEmail && (block.variant !== 'lockup' || block.tone === 'dark')) {
      err(path, 'email logos must be variant "lockup" on a light ground (SVG marks and white logos have no hosted PNG yet)');
    }
    if (block.type === 'pattern' && !ctx.inLayer) err(path, 'pattern must be a direct child of a layer');
    if (block.type === 'shape' && (block.kind === 'scrim' || block.kind === 'fade') && !ctx.inLayer) err(path, `a ${block.kind} only makes sense inside a layer`);
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
    if (page.bleed !== undefined && typeof page.bleed !== 'boolean') err(`${path}.bleed`, 'must be true or false');
    if (!colorNames.includes(page.background)) return err(`${path}.background`, `must be a brand colour: ${colorNames.join(', ')}`);
    const root = page.root;
    if (!root || root.type !== 'stack') return err(`${path}.root`, 'each page needs a root of type "stack"');
    if (isEmail && (root.direction || 'column') !== 'column') err(`${path}.root.direction`, 'email root must be a column');
    const count = { n: 0 };
    // A bleed page runs edge to edge (photo-led posts): no safe margin is applied, so
    // text blocks need their own padding.
    const bleed = page.bleed === true && format.kind !== 'email';
    const safeX = bleed ? 0 : (format.safe || 0) * scale * 2;
    walk(root, `${path}.root`, { bg: page.background, depth: 1, count, inLayer: false, width: format.w - safeX, exact: true });
    // Fixed canvas: the content must fit the page. (Email grows with content.)
    if (format.h) {
      const env = makeEnv(brand, format);
      const avail = bleed ? format.h : format.h - ((format.safeTop || format.safe) + (format.safeBottom || format.safe)) * scale;
      const est = estimateHeight(root, format.w - safeX, env);
      if (est > avail * 1.02) {
        // Say WHERE the height goes, so one revision fixes it.
        const parts = (root.children || [])
          .map((c) => ({ id: c.id, h: Math.round(estimateHeight(c, format.w - safeX, env)) }))
          .sort((a, b) => b.h - a.h)
          .slice(0, 3)
          .map((x) => `${x.id} ~${x.h}px`)
          .join(', ');
        err(path, `content is about ${Math.round(est)}px tall but only ${Math.round(avail)}px fits on the page (tallest: ${parts}) — cut about ${Math.round(est - avail)}px: shorten text, drop a block, use smaller roles or spacing, or spread it over more pages`);
      } else if (est > avail * 0.96) {
        warn(path, `content nearly fills the page (~${Math.round(est)} of ${Math.round(avail)}px)`);
      }
    }
    // an image + text in the same layer without a scrim → legibility warning
    const scan = (b, p) => {
      if (b.type === 'layer' && Array.isArray(b.children)) {
        const hasImg = b.children.some((c) => c.type === 'image');
        const hasScrim = b.children.some((c) => c.type === 'shape' && (c.kind === 'scrim' || c.kind === 'fade'));
        const hasText = b.children.some((c) => c.type === 'text' || c.type === 'stat');
        if (hasImg && hasText && !hasScrim) {
          const uploadedPhoto = b.children.some((c) => c.type === 'image' && c.src?.kind === 'upload' && library[c.src.id]?.kind !== 'logo');
          if (uploadedPhoto) err(p, 'text over an uploaded photo needs a scrim (a "shape" of kind scrim) so it stays legible');
          else warn(p, 'text over an image without a scrim');
        }
      }
      (b.children || []).forEach((c, j) => scan(c, `${p}.children[${j}]`));
    };
    scan(root, `${path}.root`);
  });

  return { ok: errors.length === 0, errors, warnings };
}

export const formatErrors = (r) => r.errors.map((e) => `${e.path || '(asset)'}: ${e.msg}`).join('\n');
