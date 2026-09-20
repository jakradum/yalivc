import { BLOCKS } from './blocks.js';

// Estimated rendered height of a block, in the format's px. Used to catch a
// page whose content is taller than the canvas — the failure that otherwise
// only shows up as squashed or clipped text after rendering.
//
// It is an ESTIMATE: text is word-wrapped greedily using an average character
// width per font (mono is exact; the body font is padded a little), and
// blocks are summed the way the renderer lays them out. Good enough to tell
// "fits" from "clearly won't"; calibrated against real renders.
const CHAR = { mono: 0.6, body: 0.5 }; // Inter averages ~0.5em on English text (calibrated against real renders)
const RATIO_VALUE = { '1:1': 1, '4:5': 0.8, '16:9': 16 / 9, '3:2': 1.5, '3:4': 0.75 };

export function makeEnv(brand, format) {
  const isEmail = format.kind === 'email';
  const scale = isEmail ? 1 : format.w / 1080;
  const mode = isEmail ? 'email' : 'canvas';
  return {
    brand,
    scale,
    space: (k) => (brand.space[k || 'none']?.[mode] ?? 0) * scale,
    role: (r) => {
      const t = brand.type[r];
      return { size: isEmail ? t.email : t.size * scale, k: CHAR[t.font], lh: t.lh };
    },
  };
}

function wrapLines(text, cpl) {
  let lines = 0;
  for (const para of String(text).replace(/==/g, '').split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines += 1;
      continue;
    }
    let cur = 0;
    let n = 1;
    for (const w of words) {
      const len = Math.min(w.length, cpl); // an over-long word is the fit check's job
      if (cur === 0) cur = len;
      else if (cur + 1 + len <= cpl) cur += 1 + len;
      else {
        n += 1;
        cur = len;
      }
    }
    lines += n;
  }
  return lines;
}

const textHeight = (env, role, text, width) => {
  const r = env.role(role);
  const cpl = Math.max(1, Math.floor(width / (r.k * r.size)));
  return wrapLines(text, cpl) * r.size * r.lh;
};

// Width a child asks for in a row: its max-content width (null = a container that
// shares whatever is left). Text sizes to its content in a flex row, so a small
// number beside a paragraph doesn't get half the row.
function hugWidth(env, b) {
  if (b.type === 'logo') return { s: 48, m: 72, l: 112, xl: 260 }[b.size || 'm'] * (b.variant === 'lockup' ? 2.1 : 1) * env.scale;
  if (b.type === 'button') return String(b.label || '').length * 0.6 * env.role('caption').size + 72 * env.scale;
  if (b.type === 'shape') return { s: 60, m: 100, l: 160 }[b.size || 'm'] * env.scale;
  const maxContent = (role, text) => {
    const r = env.role(role);
    return Math.max(...String(text).replace(/==/g, '').split('\n').map((l) => l.length)) * r.k * r.size;
  };
  if (b.type === 'tag') return String(b.label || '').length * 0.6 * env.role('micro').size + 36 * env.scale;
  if (b.type === 'text') return maxContent(b.role, b.text || '');
  if (b.type === 'stat') return Math.max(maxContent(b.size === 'medium' ? 'figure' : 'stat', b.value || ''), maxContent('caption', b.label || ''));
  if (b.type === 'list') return Math.max(0, ...(b.items || []).map((it) => maxContent(b.role || 'body', it))) + 28 * env.scale + env.space('s');
  return null;
}

export function estimateHeight(b, width, env) {
  switch (b.type) {
    case 'text':
      return textHeight(env, b.role, b.text || '', width);
    case 'stat': {
      const value = env.role(b.size === 'medium' ? 'figure' : 'stat');
      return value.size * value.lh + env.space('xs') + textHeight(env, 'caption', b.label || '', width);
    }
    case 'list': {
      const role = b.role || 'body';
      const items = b.items || [];
      const inner = Math.max(width - 28 * env.scale - env.space('s'), 1);
      return items.reduce((h, it) => h + textHeight(env, role, it, inner), 0) + env.space('xs') * Math.max(items.length - 1, 0);
    }
    case 'image':
      return width / (RATIO_VALUE[b.ratio || '3:2'] || 1.5);
    case 'logo':
      return { s: 48, m: 72, l: 112, xl: 260 }[b.size || 'm'] * env.scale;
    case 'tag': {
      const t = env.role('micro');
      return t.size * t.lh + 16 * env.scale + 4 * env.scale;
    }
    case 'shape':
      if (b.kind === 'scrim' || b.kind === 'fade') return 0;
      if (b.kind === 'band') return 8 * env.scale;
      return b.kind === 'bar' ? 8 * env.scale : ({ s: 60, m: 100, l: 160 }[b.size || 'm'] / 3) * env.scale;
    case 'spacer':
      return env.space(b.size);
    case 'divider':
      return 4 * env.scale;
    case 'button': {
      const c = env.role('caption');
      return c.size * c.lh + 36 * env.scale + 4 * env.scale;
    }
    case 'pattern':
      return 0;
    case 'layer': {
      const inFlow = (b.children || []).map((c) => estimateHeight(c, width, env));
      const content = inFlow.length ? Math.max(...inFlow) : 0;
      return b.ratio && b.ratio !== 'fill' ? width / (RATIO_VALUE[b.ratio] || 1) : content;
    }
    case 'stack':
    case 'grid': {
      const kids = b.children || [];
      const pad = env.space(b.padding);
      const gap = env.space(b.gap ?? 'm');
      const inner = width - pad * 2;
      let h;
      if (b.type === 'grid') {
        const cols = b.columns || 2;
        const cw = (inner - gap * (cols - 1)) / cols;
        const rows = [];
        kids.forEach((c, i) => {
          const r = Math.floor(i / cols);
          rows[r] = Math.max(rows[r] || 0, estimateHeight(c, cw, env));
        });
        h = rows.reduce((a, x) => a + x, 0) + gap * Math.max(rows.length - 1, 0);
      } else if ((b.direction || 'column') === 'row') {
        const hugRaw = kids.map((c) => hugWidth(env, c));
        const gaps = gap * Math.max(kids.length - 1, 0);
        const hugSum = hugRaw.reduce((a, x) => a + (x || 0), 0);
        const flexible = hugRaw.filter((x) => x === null).length;
        // Flexible containers get what's left (at least a third of the row);
        // if the hugging children alone overflow, they shrink proportionally.
        const room = inner - gaps;
        const hugBudget = flexible ? Math.min(hugSum, room * (2 / 3)) : Math.min(hugSum, room);
        const k = hugSum > hugBudget ? hugBudget / hugSum : 1;
        const share = flexible ? Math.max((room - hugSum * k) / flexible, 1) : 0;
        h = Math.max(0, ...kids.map((c, i) => estimateHeight(c, hugRaw[i] === null ? share : hugRaw[i] * k, env)));
      } else {
        h = kids.reduce((a, c) => a + estimateHeight(c, inner, env), 0) + gap * Math.max(kids.length - 1, 0);
      }
      return h + pad * 2;
    }
    default:
      return 0;
  }
}

// Used by the validator: BLOCKS is imported only so this module fails loudly if
// a block type is added without a height rule.
export const KNOWN = Object.keys(BLOCKS);
