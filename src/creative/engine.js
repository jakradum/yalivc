import { FORMATS } from './formats.js';
import { getBrand } from './brands/index.js';
import { BLOCKS, TEXT_ROLES, describeBlocks } from './blocks.js';
import { validateAsset, formatErrors } from './validate.js';
import { cropFraction } from './library.js';
import { makeEnv } from './measure.js';

// The single place an asset is mutated. Every change (from the AI's tools or
// a UI) is applied to a COPY, validated, and only kept if it doesn't
// introduce a new violation — so a stored asset is always valid, and the AI
// gets the exact reason when it isn't.

const uid = (() => {
  let n = 0;
  return (p) => `${p}-${Math.random().toString(36).slice(2, 6)}${(n++ % 10)}`;
})();

export function newAsset({ format, brand = 'yali', title = 'Untitled asset' }) {
  const b = getBrand(brand);
  return {
    schema: 'creative/1',
    id: uid('asset'),
    title,
    format,
    brand,
    assets: {},
    pages: [blankPage('page-1', b?.colors ? 'white' : 'white')],
  };
}

export const blankPage = (id, background = 'white') => ({
  id,
  background,
  root: { type: 'stack', id: `${id}-root`, direction: 'column', gap: 'm', children: [] },
});

// ── addressing ─────────────────────────────────────────────────────────────
export function locate(doc, id) {
  for (const page of doc.pages) {
    if (page.root.id === id) return { page, parent: null, index: 0, block: page.root };
    const found = search(page.root, id);
    if (found) return { page, ...found };
  }
  return null;
}
function search(parent, id) {
  const kids = parent.children || [];
  for (let i = 0; i < kids.length; i += 1) {
    if (kids[i].id === id) return { parent, index: i, block: kids[i] };
    const deeper = search(kids[i], id);
    if (deeper) return deeper;
  }
  return null;
}
const findPage = (doc, id) => {
  const i = doc.pages.findIndex((p) => p.id === id);
  if (i === -1) throw new Error(`No page "${id}". Pages: ${doc.pages.map((p) => p.id).join(', ')}`);
  return i;
};
const allIds = (doc) => {
  const out = new Set();
  const walk = (b) => {
    out.add(b.id);
    (b.children || []).forEach(walk);
  };
  doc.pages.forEach((p) => {
    out.add(p.id);
    walk(p.root);
  });
  return out;
};
// Give any block that lacks an id one (recursively), avoiding collisions.
function ensureIds(block, taken) {
  if (!block || typeof block !== 'object') return block;
  const b = { ...block };
  if (!b.id || taken.has(b.id)) {
    if (b.id && taken.has(b.id)) b.id = uid(b.type || 'b');
    else if (!b.id) b.id = uid(b.type || 'b');
  }
  taken.add(b.id);
  if (Array.isArray(b.children)) b.children = b.children.map((c) => ensureIds(c, taken));
  return b;
}

// ── operations ─────────────────────────────────────────────────────────────
const OPS = {
  set_title(doc, { title }) {
    doc.title = String(title);
    return `Title set to "${doc.title}".`;
  },

  add_page(doc, { id, after, background = 'white' }) {
    const pid = id || uid('page');
    const pos = after ? findPage(doc, after) + 1 : doc.pages.length;
    doc.pages.splice(pos, 0, blankPage(pid, background));
    return `Added page "${pid}" at position ${pos + 1}.`;
  },

  update_page(doc, { id, background }) {
    const p = doc.pages[findPage(doc, id)];
    if (background) p.background = background;
    return `Updated page "${id}".`;
  },

  move_page(doc, { id, position }) {
    const i = findPage(doc, id);
    const [p] = doc.pages.splice(i, 1);
    doc.pages.splice(Math.min(Math.max(position, 1), doc.pages.length + 1) - 1, 0, p);
    return `Moved page "${id}" to position ${position}.`;
  },

  remove_page(doc, { id }) {
    doc.pages.splice(findPage(doc, id), 1);
    return `Removed page "${id}".`;
  },

  // Replace a page's whole layout in one call — the efficient way to compose.
  set_page(doc, { id, background, root }) {
    const i = findPage(doc, id);
    const taken = allIds({ pages: doc.pages.filter((_, j) => j !== i) });
    const p = doc.pages[i];
    if (background) p.background = background;
    if (root) {
      const r = ensureIds(root, taken);
      if (!r.id) r.id = `${id}-root`;
      p.root = r;
    }
    return `Rebuilt page "${id}".`;
  },

  add_block(doc, { parent, block, index }) {
    const loc = locate(doc, parent);
    if (!loc) throw new Error(`No block "${parent}" to add into. Use a container id (page roots are "<pageId>-root").`);
    if (!BLOCKS[loc.block.type]?.container) throw new Error(`"${parent}" is a ${loc.block.type}; it cannot have children.`);
    const b = ensureIds(block, allIds(doc));
    const kids = (loc.block.children ||= []);
    kids.splice(index === undefined ? kids.length : Math.min(Math.max(index - 1, 0), kids.length), 0, b);
    return `Added ${b.type} "${b.id}" to "${parent}".`;
  },

  update_block(doc, { id, props }) {
    const loc = locate(doc, id);
    if (!loc) throw new Error(`No block "${id}".`);
    for (const k of Object.keys(props || {})) {
      if (['id', 'type', 'children'].includes(k)) throw new Error(`"${k}" can't be changed here. Use add_block / remove_block / move_block.`);
      if (props[k] === null) delete loc.block[k];
      else loc.block[k] = props[k];
    }
    return `Updated ${loc.block.type} "${id}".`;
  },

  move_block(doc, { id, parent, index }) {
    const loc = locate(doc, id);
    const dest = locate(doc, parent);
    if (!loc || !loc.parent) throw new Error(`No movable block "${id}".`);
    if (!dest) throw new Error(`No destination "${parent}".`);
    if (search(loc.block, dest.block.id) || dest.block.id === id) throw new Error('Cannot move a block into itself.');
    loc.parent.children.splice(loc.index, 1);
    const kids = (dest.block.children ||= []);
    kids.splice(index === undefined ? kids.length : Math.min(Math.max(index - 1, 0), kids.length), 0, loc.block);
    return `Moved "${id}" into "${parent}".`;
  },

  remove_block(doc, { id }) {
    const loc = locate(doc, id);
    if (!loc || !loc.parent) throw new Error(`No removable block "${id}" (page roots can't be removed; rebuild them with set_page).`);
    loc.parent.children.splice(loc.index, 1);
    return `Removed "${id}".`;
  },
};

// Error identity ignores figures, so "about 1450px tall" becoming "about 1310px
// tall" is the SAME (still-open) problem, not a newly introduced one.
const key = (msg) => msg.replace(/\d+(\.\d+)?/g, '#');
const msgCounts = (r) => {
  const m = new Map();
  for (const e of r.errors) m.set(key(e.msg), (m.get(key(e.msg)) || 0) + 1);
  return m;
};

// apply(doc, 'add_block', {...}) → { doc, message, validation }. Throws with
// the precise violations if the change would make the asset worse.
export function applyOp(doc, name, input = {}) {
  const op = OPS[name];
  if (!op) throw new Error(`Unknown operation "${name}".`);
  const before = validateAsset(doc);
  const next = structuredClone(doc);
  const message = op(next, input);
  const after = validateAsset(next);
  const prev = msgCounts(before);
  const introduced = after.errors.filter((e) => (prev.get(key(e.msg)) || 0) === 0 || after.errors.filter((x) => key(x.msg) === key(e.msg)).length > (prev.get(key(e.msg)) || 0));
  if (introduced.length) {
    throw new Error(`Rejected — this change breaks the guardrails:\n${formatErrors({ errors: introduced })}\n(Nothing was changed.)`);
  }
  return { doc: next, message, validation: after };
}

// Compact, AI-readable outline of an asset.
export function outline(doc) {
  const line = (b, d) => {
    const bits = Object.entries(b)
      .filter(([k]) => !['id', 'type', 'children'].includes(k))
      .map(([k, v]) => `${k}=${typeof v === 'string' ? JSON.stringify(v.length > 50 ? `${v.slice(0, 47)}…` : v) : JSON.stringify(v)}`)
      .join(' ');
    return `${'  '.repeat(d)}${b.type}#${b.id} ${bits}`.trimEnd();
  };
  const walk = (b, d) => [line(b, d), ...(b.children || []).flatMap((c) => walk(c, d + 1))];
  return doc.pages.map((p) => `PAGE ${p.id} (background=${p.background})\n${walk(p.root, 1).join('\n')}`).join('\n\n');
}

// ── AI tool definitions ────────────────────────────────────────────────────
const blockArg = { type: 'object', description: 'A block: { type, id?, ...props, children? }. See the block vocabulary.' };
export const TOOLS = {
  get_asset: { description: 'Show the current asset outline (pages, block ids, props).', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
  set_title: { description: 'Rename the asset.', input_schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false } },
  add_page: { description: 'Add a page (card / section). Its root is "<pageId>-root".', input_schema: { type: 'object', properties: { id: { type: 'string' }, after: { type: 'string' }, background: { type: 'string', description: 'brand colour name' } }, additionalProperties: false } },
  update_page: { description: 'Change a page background.', input_schema: { type: 'object', properties: { id: { type: 'string' }, background: { type: 'string' } }, required: ['id'], additionalProperties: false } },
  move_page: { description: 'Move a page to a 1-based position.', input_schema: { type: 'object', properties: { id: { type: 'string' }, position: { type: 'integer' } }, required: ['id', 'position'], additionalProperties: false } },
  remove_page: { description: 'Delete a page.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false } },
  set_page: {
    description: 'Replace a page\'s entire layout with a new block tree (and optionally its background). The fastest way to compose a page: send the whole tree in `root` (a stack containing everything).',
    input_schema: { type: 'object', properties: { id: { type: 'string' }, background: { type: 'string' }, root: blockArg }, required: ['id', 'root'], additionalProperties: false },
  },
  add_block: { description: 'Add a block (with any children) into a container.', input_schema: { type: 'object', properties: { parent: { type: 'string' }, block: blockArg, index: { type: 'integer', description: '1-based; default end' } }, required: ['parent', 'block'], additionalProperties: false } },
  update_block: { description: 'Change props on a block (null removes a prop). Cannot change id/type/children.', input_schema: { type: 'object', properties: { id: { type: 'string' }, props: { type: 'object' } }, required: ['id', 'props'], additionalProperties: false } },
  move_block: { description: 'Move a block into another container.', input_schema: { type: 'object', properties: { id: { type: 'string' }, parent: { type: 'string' }, index: { type: 'integer' } }, required: ['id', 'parent'], additionalProperties: false } },
  remove_block: { description: 'Delete a block and its children.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false } },
};
export const anthropicTools = () => Object.entries(TOOLS).map(([name, t]) => ({ name, ...t }));

// Runs one tool call against a mutable holder { doc }.
export function runTool(holder, name, input) {
  if (name === 'get_asset') return outline(holder.doc);
  const { doc, message, validation } = applyOp(holder.doc, name, input);
  holder.doc = doc;
  const w = validation.warnings.length ? `\nWarnings:\n${validation.warnings.map((x) => `${x.path}: ${x.msg}`).join('\n')}` : '';
  return `OK — ${message}${w}`;
}

// ── uploaded assets, as the AI sees them ───────────────────────────────────
function assetSection(doc) {
  const ids = Object.keys(doc.assets || {});
  if (!ids.length) return 'UPLOADED ASSETS: none. Do not use photographs; you may use the brand logo and patterns.';
  const rows = ids.map((id) => {
    const a = doc.assets[id];
    const rules = [
      a.kind === 'logo' ? 'logo: fit "contain" only, never cropped or recoloured' : null,
      a.noCrop ? 'do not crop (fit "contain")' : null,
      a.kind === 'logo' && a.ground && a.ground !== 'any' ? `only on ${a.ground} grounds` : null,
      a.people ? 'shows people: no claims about them beyond the alt text' : null,
    ].filter(Boolean);
    return `- id "${id}" — ${a.kind}, ${a.width}×${a.height} (natural ratio ${(a.width / a.height).toFixed(2)}:1)\n    alt: "${a.alt}"${a.description ? `\n    note: ${a.description}` : ''}${rules.length ? `\n    rules: ${rules.join('; ')}` : ''}`;
  });
  return `UPLOADED ASSETS — the only pictures you may use. Reference as { "type":"image", "src": { "kind":"upload", "id":"<id>" } }; its alt text is applied for you.
${rows.join('\n')}
HOW TO USE THEM
- Use only what the request calls for; do not add a picture just to fill space, and never invent or alter one.
- Photos: fit "cover", with a ratio close to the picture's natural ratio (a big mismatch crops away the subject and is rejected). Never place text directly on a photo without a scrim shape between them.
- Logos: fit "contain", never grayscale, only on a ground the logo is marked for.
- Respect each asset's rules and note. If none of the assets suits what was asked, say so instead of stretching one.
- Say nothing about what a picture shows beyond its alt text and note — you cannot be sure what is in it.`;
}

// The space a page actually has, in the same px the guardrail measures, so the
// model can plan a page that fits instead of discovering it by rejection.
function budget(format, brand) {
  if (!format.h) return 'PAGE BUDGET: none — an email grows with its content (keep it scannable).';
  const env = makeEnv(brand, format);
  const sc = format.w / 1080;
  const w = Math.round(format.w - format.safe * sc * 2);
  const h = Math.round(format.h - ((format.safeTop || format.safe) + (format.safeBottom || format.safe)) * sc);
  const line = (r) => Math.round(env.role(r).size * env.role(r).lh);
  return `PAGE BUDGET (content must fit — taller pages are rejected): ${w}px wide × ${h}px tall per page.
One line of text costs: ${Object.keys(TEXT_ROLES).filter((r) => r !== 'stat').map((r) => `${r} ${line(r)}px`).join(', ')}; a stat figure ${line('stat')}px (medium ${line('figure')}px). Gaps between blocks: ${Object.entries(brand.space).filter(([k]) => k !== 'none').map(([k, v]) => `${k} ${Math.round(v.canvas * sc)}px`).join(', ')}.
Plan the whole page against ${h}px before building: roughly ${Math.max(1, Math.floor(h / line('body')))} lines of body text is the ceiling, and headings, gaps and lists use it up quickly. When in doubt, do less per page.`;
}

// ── system prompt ──────────────────────────────────────────────────────────
export function systemPrompt(doc) {
  const format = FORMATS[doc.format];
  const brand = getBrand(doc.brand);
  const roles = Object.keys(TEXT_ROLES).map((r) => `${r} (≤${TEXT_ROLES[r]} chars)`).join(', ');
  return `You design ${format.label} assets for ${brand.name} by composing blocks in a JSON document, using tools. You are creative and free to lay things out however serves the message — within the guardrails below, which are enforced: a change that breaks them is rejected with the reason, so read errors and fix them.

FORMAT: ${format.label} — ${format.w}${format.h ? `×${format.h}` : ' wide, height follows content'} px, ${format.kind === 'email' ? 'ONE continuous page' : `${format.minPages}–${format.maxPages} pages`}. Safe margins are applied for you; do not add margin to keep things off the edge.
${budget(format, brand)}

BRAND TOKENS (the only ones that exist)
- colours: ${Object.entries(brand.colors).map(([k, v]) => `${k} ${v}`).join(', ')}
- type roles: ${roles} — you choose a role, never a size or font.
- spacing steps: ${Object.keys(brand.space).join(', ')}; radius: ${Object.keys(brand.radius).join(', ')}.
- images: only the uploaded assets listed below, or the brand library (${Object.keys(brand.images.library).join(', ')}) — never a URL; links: https to ${brand.linkHosts.join(', ')} only.
- brand voice: ${brand.voice.join(' ')}

${assetSection(doc)}

BLOCKS
${describeBlocks()}

RULES
- Layout is nesting: stack (row/column), grid, layer. There are no coordinates.
- Text must have AA contrast on the background it sits on (white on crimson, ink on light/white; gold on crimson for accents). Use a scrim when text sits over an image.
- Every number must have provenance (stat.source): "user" if the person gave it to you or "sanity:<doc>.<field>". NEVER invent figures, quotes, names, dates or claims. If you need a fact you weren't given, leave it out or ask.
- Financial performance (returns, MOIC, IRR, AUM growth) is a regulated claim: only use it if the person gave it to you, mark it source "user", and SAY in your reply that it needs verifying against the LP report. Do not repeat a return or growth figure the person did not provide.
- Hierarchy over decoration: one clear headline per page, generous space, few blocks (aim under 12 per page). No icons or emoji.
- ${format.kind === 'email' ? 'Email: single column, shallow nesting, max 2 grid columns, no layers/patterns/shapes. Include a clear button (https link) and a short footer line.' : 'Carousel/page sets: a cover with a strong headline, content pages that each make one point, and a closing page with a call to action. Keep the visual system consistent across pages.'}
- Prefer set_page to build a whole page in one call, then adjust with update_block. Use get_asset to see ids.
- You may be resumed: if the request is "continue", call get_asset first, see what is already built, and finish only what is missing — don't start over.
- When done, reply in one or two plain sentences saying what you made. If asked for something the guardrails don't allow (a free colour, a font size, an outside image), say so and offer the closest on-brand option.

Current asset "${doc.title}":
${outline(doc)}`;
}
