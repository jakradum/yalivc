import { SLIDE_W, SLIDE_H } from '../core/constants';

// Plain, server-safe. No hooks, no client-only APIs — must render
// identically in the client-boundary preview and in SSR print output.
export function SlideCanvas({ id, index, children }) {
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
    </section>
  );
}
