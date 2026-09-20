import 'server-only';
import { getManifest, OPTIONAL_PROPS } from './catalog';
import { loadDeckData } from '@/decks/data/loadDeckData';
import { readManifest } from './store';

// The builder home page's registry. An "asset" is one editable thing; its
// kind points at a TEMPLATE — canvas size, the layouts it can use, and the
// fields each layout exposes. Today there is one kind (`deck`); a new asset
// type = a new template entry here plus the code behind it (components,
// data mapping, manifest). Layouts and fields are always defined in code:
// editors and Claude only fill, reorder and hide, never invent layout.
export const TEMPLATES = {
  deck: {
    title: 'Investor deck',
    canvas: { w: 960, h: 540, label: '960 × 540 px slides' },
    exports: ['PDF'],
    editorPath: '/builder/deck',
  },
};

export const ASSETS = [
  {
    id: 'fund-ii',
    kind: 'deck',
    deckId: 'fund-ii',
    title: 'Yali Capital Fund II — investor deck',
    description: 'The Fund II investor presentation: team, thesis, process, Fund I performance, structure and terms, appendix.',
    previewPath: '/decks/fund-ii/?data=sanity',
    draftPreviewPath: '/decks/fund-ii/?data=sanity&manifest=draft',
  },
];

const URLISH = /(url|src|href|link|photo|logo|image)/i;

function describeValue(v) {
  if (Array.isArray(v)) {
    const sample = v.find((x) => x && typeof x === 'object');
    return sample ? `list of { ${Object.keys(sample).join(', ')} }` : 'list of text';
  }
  if (v && typeof v === 'object') return `group { ${Object.keys(v).join(', ')} }`;
  return typeof v === 'number' ? 'number' : 'text';
}

// Layout catalogue for a deck: every slide type in the manifest, which
// slides use it, and the fields an editor may change (from the props the
// slide actually builds — the same shape validate.js checks against).
export async function deckLayouts(deckId) {
  const data = await loadDeckData(deckId, { dataSource: 'fixture' });
  const byType = new Map();
  for (const s of getManifest(deckId).slides) {
    const props = s.build(data);
    const entry = byType.get(s.type) || { type: s.type, slides: [], fields: {} };
    entry.slides.push(s.id);
    for (const [k, v] of Object.entries(props || {})) {
      if (!(k in entry.fields)) entry.fields[k] = URLISH.test(k) ? 'locked (image / link)' : describeValue(v);
    }
    byType.set(s.type, entry);
  }
  return [...byType.values()].map((l) => ({
    ...l,
    // Optional props the layout accepts that the built props don't already show.
    optional: Object.entries(OPTIONAL_PROPS[l.type] || {})
      .filter(([k]) => !(k in l.fields))
      .map(([k, t]) => `${k} (${t}, optional)`),
  }));
}

// Live status for an asset card.
export async function assetStatus(asset) {
  const m = await readManifest(asset.deckId, 'draft');
  const visible = m.entries.filter((e) => !e.hidden).length;
  const hidden = m.entries.length - visible;
  const last = [...m.log].reverse().find(Boolean) || null;
  return {
    hasDraft: m.hasDraft,
    hasPublished: m.hasPublished,
    slideCount: visible,
    hidden,
    lastEdit: last ? { at: last.at, by: last.by, summary: last.summary } : null,
  };
}
