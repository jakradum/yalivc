import 'server-only';
import { fundIIDeck } from '../decks/fund-ii/manifest';

// The code manifest is the catalog: it defines every slide that exists
// (type + how its props are built from data) and the default order. The
// Sanity deckManifest only orders and overrides. Adding a slide TYPE or a
// new data source is a code change (PR), never an edit.
const MANIFESTS = { 'fund-ii': fundIIDeck };

// The one type that can be created from scratch — it needs no data.
export const GENERIC_DIVIDER = {
  ref: 'section-divider',
  type: 'section-divider',
  build: () => ({ heading: 'New section', pattern: 1 }),
};

// Props a slide accepts that the built props may not contain (they're
// optional in the component), with the primitive type they must have.
export const OPTIONAL_PROPS = {
  cover: { eyebrow: 'string', tag: 'string' },
  'section-divider': { sub: 'string', pattern: 'number' },
};

export function getManifest(deckId) {
  const m = MANIFESTS[deckId];
  if (!m) throw new Error(`Unknown deck: ${deckId}`);
  return m;
}

export function getDefinition(deckId, ref) {
  if (ref === GENERIC_DIVIDER.ref) return GENERIC_DIVIDER;
  return getManifest(deckId).slides.find((s) => s.id === ref) || null;
}

// Default order, no overrides.
export function codeDefaultEntries(deckId) {
  return getManifest(deckId).slides.map((s) => ({ id: s.id, ref: s.id, props: {} }));
}

export function catalogRefs(deckId) {
  return getManifest(deckId).slides.map((s) => ({ ref: s.id, type: s.type }));
}
