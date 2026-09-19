'use client';

import { SlideCanvas } from '../canvas/SlideCanvas';
import { slideComponents, decks } from './registry';

// Client-boundary render tree — same component tree used for preview
// (inside PreviewShell) and print (inside PrintShell, still SSR'd first).
// Editing any slide type / block / manifest triggers client-side Fast
// Refresh, which is the fast path we're protecting per the owner's
// "instant live preview" requirement.
export function DeckRenderer({ deckId, data }) {
  const deck = decks[deckId];
  if (!deck) {
    return <div style={{ padding: 24, fontFamily: 'monospace' }}>Unknown deck: {deckId}</div>;
  }

  return (
    <>
      {deck.slides.map((slide, index) => {
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
          <SlideCanvas key={slide.id} id={slide.id} index={index}>
            <Component {...slide.build(data)} />
          </SlideCanvas>
        );
      })}
    </>
  );
}
