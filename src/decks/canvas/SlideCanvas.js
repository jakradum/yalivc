import { SLIDE_W, SLIDE_H } from '../core/constants';
import { SlideNumber } from '../design-system/blocks/SlideNumber/SlideNumber';

// Plain, server-safe. No hooks, no client-only APIs — must render
// identically in the client-boundary preview and in SSR print output.
// `numberMode`: 'skip' | 'light' | 'dark' (see core/slideNumbers.js).
export function SlideCanvas({ id, index, numberMode = 'skip', children }) {
  return (
    <section
      className="deck-slide"
      data-slide-id={id}
      data-slide-index={index}
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: '#ffffff',
        breakAfter: 'page',
        flexShrink: 0,
      }}
    >
      {children}
      {numberMode !== 'skip' ? <SlideNumber number={index + 1} dark={numberMode === 'dark'} autoHide /> : null}
    </section>
  );
}
