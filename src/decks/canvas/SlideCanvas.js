import { SLIDE_W, SLIDE_H } from '../core/constants';
import { SlideNumber } from '../design-system/blocks/SlideNumber/SlideNumber';

// Plain, server-safe. No hooks, no client-only APIs — must render
// identically in the client-boundary preview and in SSR print output.
// `numberMode`: 'skip' | 'light' | 'dark' (see core/slideNumbers.js).
export function SlideCanvas({ id, index, numberMode = 'skip', section, crimsonGround = numberMode === 'dark', children }) {
  const onCrimson = crimsonGround;
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
        background: 'var(--deck-color-light-bg)', // legacy --light; crimson slides paint over it
        breakAfter: 'page',
        flexShrink: 0,
      }}
    >
      {children}
      {section ? (
        // Legacy section breadcrumb: 8px mono caps, top-right, 45% opacity.
        <div style={{ position: 'absolute', top: 9, right: 14, zIndex: 150, fontFamily: 'var(--deck-font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: onCrimson ? 'var(--deck-color-gold)' : 'var(--deck-color-crimson)', opacity: 0.45, pointerEvents: 'none' }}>
          {section}
        </div>
      ) : null}
      {/* Legacy .slide::after watermark, on every slide. */}
      <div style={{ position: 'absolute', bottom: 7, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--deck-font-mono)', fontSize: 6.5, letterSpacing: '0.16em', color: 'rgba(54,54,54,0.16)', zIndex: 200, pointerEvents: 'none' }}>
        CONFIDENTIAL · YALI CAPITAL · NOT FOR DISTRIBUTION
      </div>
      {numberMode !== 'skip' ? <SlideNumber number={index + 1} dark={numberMode === 'dark'} autoHide /> : null}
    </section>
  );
}
