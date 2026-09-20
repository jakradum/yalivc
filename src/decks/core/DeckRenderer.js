'use client';

import { SlideCanvas } from '../canvas/SlideCanvas';
import { slideComponents, decks } from './registry';
import { slideNumberMode } from './slideNumbers';

// Client-boundary render tree — same component tree used for preview
// (inside PreviewShell) and print (inside PrintShell, still SSR'd first).
// Editing any slide type / block / manifest triggers client-side Fast
// Refresh, which is the fast path we're protecting per the owner's
// "instant live preview" requirement.
//
// `slides` is the server-resolved list [{ id, type, props }] (code manifest
// order + Sanity deckManifest overrides). Without it, falls back to the
// code manifest and builds props from `data` directly.
export function DeckRenderer({ deckId, data, slides: resolved }) {
  const deck = decks[deckId];
  if (!deck) {
    return <div style={{ padding: 24, fontFamily: 'monospace' }}>Unknown deck: {deckId}</div>;
  }
  const slides = resolved || deck.slides.map((s) => ({ id: s.id, type: s.type, props: s.build(data) })).filter((s) => s.props !== null);

  return (
    <>
      {slides.map((slide, index) => {
        const Component = slideComponents[slide.type];
        if (!Component) {
          return (
            <SlideCanvas key={slide.id} id={slide.id} index={index}>
              <div style={{ padding: 24, fontFamily: 'monospace', color: 'red' }}>
                Unregistered slide type: {slide.type}
              </div>
            </SlideCanvas>
          );
        }
        return (
          <SlideCanvas key={slide.id} id={slide.id} index={index} numberMode={slideNumberMode(slide.type)}>
            <Component {...slide.props} />
          </SlideCanvas>
        );
      })}
    </>
  );
}
