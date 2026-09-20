import 'server-only';
import { readManifest } from './store';

// The builder home page's registry: one entry per editable asset. `kind`
// says how it's edited (deck → /builder/deck). Free-form creative assets
// live in the creative studio instead (src/creative).
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
