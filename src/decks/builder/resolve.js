import 'server-only';
import { getDefinition } from './catalog';
import { readManifest } from './store';
import { assignSections } from '../core/slideNumbers';

// Effective slide list for rendering: [{ id, type, props }], all
// serialisable so it can cross into the client DeckRenderer.
// manifest: 'code' (ignore Sanity), 'published' (default), 'draft'.
export async function resolveDeckSlides(deckId, data, manifest = 'published') {
  const { entries } =
    manifest === 'code' ? await import('./catalog').then((c) => ({ entries: c.codeDefaultEntries(deckId) })) : await readManifest(deckId, manifest);
  const slides = [];
  for (const e of entries) {
    if (e.hidden) continue; // hidden = kept in the manifest, left out of the output
    const def = getDefinition(deckId, e.ref);
    if (!def) continue; // a stale ref (slide removed from code) is skipped, not fatal
    const built = def.build(data);
    if (built === null) continue; // a slide whose data doesn't exist (e.g. appendix page 2 with ≤4 companies)
    slides.push({ id: e.id, type: def.type, sectionStart: def.section, props: { ...built, ...e.props } });
  }
  return assignSections(slides);
}
