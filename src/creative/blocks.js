// The block vocabulary: the complete set of things an asset can contain and,
// for each, exactly which props it accepts. This one table drives the
// validator, the AI's tool descriptions and the docs — there is no second list.
//
// Prop types:  enum · color (brand colour NAME) · space (spacing STEP) ·
//              radius · str (max length) · int (min..max) · bool · ref (image
//              source) · url · strs (list of short strings)
// Note what's absent on purpose: hex colours, px sizes, font names, absolute
// coordinates. Layout is only ever nesting (stack/grid/layer); type is only a
// role; colour is only a name.

export const TEXT_ROLES = {
  // role: max characters. Sizes come from the brand, never from the author.
  display: 70,
  title: 90,
  heading: 110,
  subhead: 140,
  body: 320,
  caption: 160,
  eyebrow: 48,
  stat: 12,
  quote: 220,
};

const enumOf = (values, def) => ({ t: 'enum', values, def });
const color = (def) => ({ t: 'color', def });
const space = (def) => ({ t: 'space', def });
const radius = (def) => ({ t: 'radius', def });
const str = (max, extra = {}) => ({ t: 'str', max, ...extra });
const int = (min, max, def) => ({ t: 'int', min, max, def });
const bool = (def) => ({ t: 'bool', def });

const ALIGN = enumOf(['start', 'center', 'end'], 'start');
const OPACITY = enumOf([0.15, 0.3, 0.5, 0.7, 0.85, 1], 1);

export const BLOCKS = {
  // ── containers ────────────────────────────────────────────────────────
  stack: {
    container: true,
    doc: 'Lays children out in a column or a row. The workhorse: nest stacks to build any layout.',
    props: {
      direction: enumOf(['column', 'row'], 'column'),
      gap: space('m'),
      padding: space('none'),
      align: enumOf(['start', 'center', 'end', 'stretch'], 'stretch'),
      justify: enumOf(['start', 'center', 'end', 'between'], 'start'),
      fill: color(undefined),
      border: color(undefined),
      radius: radius('none'),
      grow: bool(false),
    },
  },
  grid: {
    container: true,
    doc: 'Equal-width columns (2–4; 2 in email). For stat rows, feature grids, side-by-side.',
    props: {
      columns: { ...int(2, 4), required: true },
      gap: space('m'),
      padding: space('none'),
      fill: color(undefined),
      border: color(undefined),
      radius: radius('none'),
    },
  },
  layer: {
    container: true,
    doc: 'Stacks children on top of each other, each pinned with `anchor`. For a photo with a scrim and caption, badges, or a pattern behind text. Not available in email.',
    props: {
      ratio: enumOf(['1:1', '4:5', '16:9', '3:2', 'fill'], 'fill'),
      fill: color(undefined),
      radius: radius('none'),
    },
  },

  // ── leaves ────────────────────────────────────────────────────────────
  text: {
    doc: 'A piece of text in a type ROLE (display, title, heading, subhead, body, caption, eyebrow, stat, quote). Wrap a word in |pipes| to highlight it.',
    props: {
      role: { ...enumOf(Object.keys(TEXT_ROLES)), required: true },
      text: { ...str(400), required: true },
      color: { ...color(), required: true },
      align: ALIGN,
    },
  },
  stat: {
    doc: 'A big number with a label. `source` is REQUIRED: "user" (the person supplied the number) or "sanity:<doc>.<field>". Numbers are never invented.',
    props: {
      value: { ...str(12), required: true },
      label: { ...str(60), required: true },
      source: { ...str(120), required: true },
      color: { ...color('crimson') },
      align: ALIGN,
    },
  },
  image: {
    doc: 'A picture from an allowed source only (Sanity asset URL or a brand library key). Alt text is required unless decorative.',
    props: {
      src: { t: 'ref', required: true },
      alt: str(160),
      decorative: bool(false),
      fit: enumOf(['cover', 'contain'], 'cover'),
      ratio: enumOf(['1:1', '4:5', '16:9', '3:2', '3:4'], '3:2'),
      radius: radius('none'),
      tone: enumOf(['none', 'grayscale'], 'none'),
    },
  },
  logo: {
    doc: 'The brand mark or lockup. `tone` is the ground it sits on: light = dark logo, dark = white logo.',
    props: { variant: enumOf(['mark', 'lockup'], 'mark'), tone: enumOf(['light', 'dark'], 'light'), size: enumOf(['s', 'm', 'l'], 'm'), align: ALIGN },
  },
  shape: {
    doc: 'A plain graphic: `bar` (a short accent rule), `dot`, or `scrim` (a translucent colour wash, for legible text over a photo). Not available in email.',
    props: { kind: { ...enumOf(['bar', 'dot', 'scrim']), required: true }, color: { ...color(), required: true }, size: enumOf(['s', 'm', 'l'], 'm'), opacity: OPACITY },
  },
  pattern: {
    doc: 'One of the seven brand line patterns (1–7), filling its parent layer. Decorative only. Not available in email.',
    props: { name: { ...int(1, 7), required: true }, color: color('gold'), opacity: enumOf([0.15, 0.3, 0.5, 0.7], 0.5) },
  },
  spacer: { doc: 'Empty vertical space of one spacing step.', props: { size: { ...space(), required: true } } },
  divider: { doc: 'A thin horizontal rule.', props: { color: color('ink'), weight: enumOf(['thin', 'medium'], 'thin') } },
  list: {
    doc: 'A short list (max 8 items). Marker: dot, dash or number.',
    props: {
      items: { t: 'strs', maxItems: 8, maxLen: 120, required: true },
      marker: enumOf(['dot', 'dash', 'number'], 'dot'),
      role: enumOf(['body', 'caption'], 'body'),
      color: { ...color(), required: true },
    },
  },
  button: {
    doc: 'A call-to-action link. `href` must be https to an allowed host. The label colour is chosen automatically for contrast.',
    props: { label: { ...str(32), required: true }, href: { t: 'url', required: true }, style: enumOf(['solid', 'outline'], 'solid'), color: color('crimson'), align: ALIGN },
  },
};

// Optional props any block may carry when it is a direct child of a `layer`.
export const LAYER_CHILD_PROPS = {
  anchor: enumOf(['fill', 'tl', 'tr', 'bl', 'br', 'top', 'bottom', 'center'], 'fill'),
  inset: space('none'),
};

// A compact description for the AI's system prompt.
export function describeBlocks() {
  const fmt = (name, p) => {
    if (p.t === 'enum') return `${name}: ${p.values.join('|')}${p.def !== undefined ? ` (default ${p.def})` : ''}${p.required ? ' *' : ''}`;
    if (p.t === 'color') return `${name}: <colour name>${p.required ? ' *' : ''}`;
    if (p.t === 'space') return `${name}: <space step>${p.required ? ' *' : ''}`;
    if (p.t === 'radius') return `${name}: <radius>`;
    if (p.t === 'str') return `${name}: text ≤${p.max}${p.required ? ' *' : ''}`;
    if (p.t === 'int') return `${name}: ${p.min}–${p.max}${p.required ? ' *' : ''}`;
    if (p.t === 'bool') return `${name}: true|false`;
    if (p.t === 'ref') return `${name}: {kind:"sanity",url}|{kind:"library",key} *`;
    if (p.t === 'url') return `${name}: https URL *`;
    if (p.t === 'strs') return `${name}: [text ≤${p.maxLen}] max ${p.maxItems} *`;
    return name;
  };
  return Object.entries(BLOCKS)
    .map(([type, b]) => `- ${type}${b.container ? ' (container: has children[])' : ''} — ${b.doc}\n    props: ${Object.entries(b.props).map(([k, p]) => fmt(k, p)).join('; ')}`)
    .join('\n');
}
