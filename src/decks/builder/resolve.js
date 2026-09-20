import 'server-only';
import { getDefinition } from './catalog';
import { readManifest } from './store';

// Effective slide list for rendering: [{ id, type, props }], all
// serialisable so it can cross into the client DeckRenderer.
// manifest: 'code' (ignore Sanity), 'published' (default), 'draft'.
export async function resolveDeckSlides(deckId, data, manifest = 'published') {
  const { entries } =
    manifest === 'code' ? await import('./catalog').then((c) => ({ entries: c.codeDefaultEntries(deckId) })) : await readManifest(deckId, manifest);
  const slides = [];
  for (const e of entries) {
    const def = getDefinition(deckId, e.ref);
    if (!def) continue; // a stale ref (slide removed from code) is skipped, not fatal
    slides.push({ id: e.id, type: def.type, props: { ...(def.build(data) || {}), ...e.props } });
  }
  return slides;
}
