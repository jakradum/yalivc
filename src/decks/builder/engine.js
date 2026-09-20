import 'server-only';
import { getDefinition, catalogRefs, GENERIC_DIVIDER } from './catalog';
import { validateOverrides } from './validate';

// The complete set of things an edit can do. Both the Claude agent and the
// builder's own drag/remove buttons go through runTool, so there is exactly
// one code path that mutates a deck — and it can only reorder, add/remove
// EXISTING slide types, and override validated props.
//
// ctx = { deckId, entries: [{ id, ref, props }], data, log: [] }
//   data — the deck data the slides are built from (for base props)

const typeOf = (deckId, ref) => getDefinition(deckId, ref)?.type;

function baseProps(ctx, ref) {
  const def = getDefinition(ctx.deckId, ref);
  if (!def) throw new Error(`Unknown slide definition "${ref}"`);
  return def.build(ctx.data) || {};
}

function find(ctx, id) {
  const i = ctx.entries.findIndex((e) => e.id === id);
  if (i === -1) throw new Error(`No slide with id "${id}". Use list_slides to see current ids.`);
  return i;
}

const clampPos = (ctx, position) => {
  const n = Number.isInteger(position) ? position : ctx.entries.length;
  return Math.min(Math.max(n, 1), ctx.entries.length + 1) - 1;
};

const short = (v) => JSON.stringify(v).slice(0, 4000);

export const TOOLS = {
  list_slides: {
    description: 'List the deck\'s slides in order (position, id, type, which props are overridden), and the removed slides that can be re-added.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
    run(ctx) {
      const present = new Set(ctx.entries.map((e) => e.ref));
      return short({
        slides: ctx.entries.map((e, i) => ({
          position: i + 1,
          id: e.id,
          type: typeOf(ctx.deckId, e.ref),
          overridden: Object.keys(e.props),
        })),
        removed: catalogRefs(ctx.deckId).filter((c) => !present.has(c.ref)),
      });
    },
  },

  get_slide_props: {
    description: 'Show a slide\'s current editable props (built value with any overrides applied). Pass `key` to see one prop in full; otherwise long lists are summarised.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' }, key: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    run(ctx, { id, key }) {
      const e = ctx.entries[find(ctx, id)];
      const eff = { ...baseProps(ctx, e.ref), ...e.props };
      if (key) {
        if (!(key in eff)) throw new Error(`"${key}" is not a prop of this slide (props: ${Object.keys(eff).join(', ')})`);
        return short(eff[key]);
      }
      const out = {};
      for (const [k, v] of Object.entries(eff)) {
        out[k] = Array.isArray(v) ? `[list of ${v.length}] (use key="${k}" to see it)` : typeof v === 'object' && v ? '[object] (use key to see it)' : v;
      }
      return short(out);
    },
  },

  set_slide_props: {
    description: 'Override text/number props on a slide. Only fields the slide already has can be set (plus `sub`/`pattern` on dividers and `eyebrow`/`tag` on the cover); lists must keep the same item shape. Image and link fields cannot be edited. Divider `heading` uses \\n for line breaks; `pattern` is 1–7.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' }, props: { type: 'object' } },
      required: ['id', 'props'],
      additionalProperties: false,
    },
    run(ctx, { id, props }) {
      const i = find(ctx, id);
      const e = ctx.entries[i];
      const type = typeOf(ctx.deckId, e.ref);
      const base = baseProps(ctx, e.ref);
      validateOverrides(type, base, props);
      e.props = { ...e.props, ...props };
      ctx.log.push(`Set ${Object.keys(props).join(', ')} on ${id}`);
      return `OK — updated ${Object.keys(props).join(', ')} on "${id}".`;
    },
  },

  reset_slide_props: {
    description: 'Remove all prop overrides from a slide, restoring its default content.',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
    run(ctx, { id }) {
      const e = ctx.entries[find(ctx, id)];
      e.props = {};
      ctx.log.push(`Reset ${id} to defaults`);
      return `OK — "${id}" restored to defaults.`;
    },
  },

  move_slide: {
    description: 'Move a slide to a 1-based position in the deck.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' }, position: { type: 'integer', minimum: 1 } },
      required: ['id', 'position'],
      additionalProperties: false,
    },
    run(ctx, { id, position }) {
      const i = find(ctx, id);
      const [e] = ctx.entries.splice(i, 1);
      const to = clampPos(ctx, position);
      ctx.entries.splice(to, 0, e);
      ctx.log.push(`Moved ${id} to position ${to + 1}`);
      return `OK — "${id}" is now slide ${to + 1}.`;
    },
  },

  remove_slide: {
    description: 'Remove a slide from the deck. Catalog slides can be re-added later with add_slide.',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
    run(ctx, { id }) {
      const i = find(ctx, id);
      if (ctx.entries.length <= 1) throw new Error('A deck needs at least one slide.');
      ctx.entries.splice(i, 1);
      ctx.log.push(`Removed ${id}`);
      return `OK — removed "${id}".`;
    },
  },

  add_slide: {
    description: `Add a slide. \`ref\` is either the id of a catalog slide that is currently removed (see list_slides → removed), or "${GENERIC_DIVIDER.ref}" to create a new section divider (then set its heading/sub/pattern with \`props\`). Other slide types cannot be created from scratch.`,
    input_schema: {
      type: 'object',
      properties: {
        ref: { type: 'string' },
        position: { type: 'integer', minimum: 1, description: '1-based; defaults to the end' },
        props: { type: 'object', description: 'Only for new section dividers' },
      },
      required: ['ref'],
      additionalProperties: false,
    },
    run(ctx, { ref, position, props }) {
      const def = getDefinition(ctx.deckId, ref);
      if (!def) throw new Error(`Unknown slide "${ref}". Only removed catalog slides or "${GENERIC_DIVIDER.ref}" can be added.`);
      let id = ref;
      if (ref === GENERIC_DIVIDER.ref) {
        id = `divider-${Math.random().toString(36).slice(2, 6)}`;
      } else if (ctx.entries.some((e) => e.ref === ref)) {
        throw new Error(`"${ref}" is already in the deck.`);
      }
      const entry = { id, ref, props: {} };
      if (props) {
        if (ref !== GENERIC_DIVIDER.ref) throw new Error('props can only be given when creating a new section divider; use set_slide_props afterwards.');
        validateOverrides(def.type, def.build(ctx.data), props);
        entry.props = { ...props };
      }
      ctx.entries.splice(clampPos(ctx, position), 0, entry);
      ctx.log.push(`Added ${id}`);
      return `OK — added "${id}" at position ${ctx.entries.findIndex((e) => e.id === id) + 1}.`;
    },
  },
};

export function runTool(ctx, name, input) {
  const tool = TOOLS[name];
  if (!tool) throw new Error(`Unknown tool "${name}"`);
  return tool.run(ctx, input || {});
}

export const anthropicTools = () =>
  Object.entries(TOOLS).map(([name, t]) => ({ name, description: t.description, input_schema: t.input_schema }));
