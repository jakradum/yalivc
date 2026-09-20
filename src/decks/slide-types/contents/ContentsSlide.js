import { Honeycomb } from '@/decks/design-system/blocks/Honeycomb/Honeycomb';

// Pixel-matched to legacy .s2-index — a crimson left panel (title + sub)
// and a white right panel of numbered section rows. Rebuilt from
// scratch; the Phase 3 draft was a plain centered list.
export function ContentsSlide({ title, subtitle, sections = [] }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'stretch' }}>
      <div style={{ width: 340, flexShrink: 0, background: 'var(--deck-color-crimson)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '52px 52px 52px 60px', position: 'relative', overflow: 'hidden' }}>
        <Honeycomb width={340} height={540} opacity={0.45} style={{ pointerEvents: 'none' }} />
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 34, fontWeight: 400, color: 'var(--deck-color-gold)', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 12, lineHeight: 1.5, position: 'relative', zIndex: 1, whiteSpace: 'pre-line' }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 56px' }}>
        {sections.map((s, i) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'baseline', gap: 20, padding: '13px 0', borderBottom: i < sections.length - 1 ? '1px solid var(--deck-color-ink)' : 'none' }}>
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-crimson)', width: 24, flexShrink: 0, letterSpacing: '0.04em' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--deck-color-ink)', flex: 1 }}>{s.name}</span>
            {s.slideCount ? (
              <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, color: '#aaa', letterSpacing: '0.06em' }}>{s.slideCount}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
