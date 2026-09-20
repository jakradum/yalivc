// Pixel-matched to legacy .s3-div/.fi-div (they're identical rules under
// two names). Text is right-aligned, NOT centered — the Phase 3 draft
// centered it. The side pattern-grid (.s3-div-grid) is
// ported in SeparatorPattern; the manifest picks which of the 7 each
// divider gets.
import { SeparatorPattern } from '@/decks/design-system/blocks/SeparatorPattern/SeparatorPattern';

export function SectionDivider({ heading, sub, pattern }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--deck-color-crimson)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, textAlign: 'right', padding: '0 0 0 80px' }}>
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 62, fontWeight: 400, color: 'var(--deck-color-gold)', lineHeight: 1.15, whiteSpace: 'pre-line' }}>
          {heading}
        </div>
        {sub ? (
          <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 16 }}>{sub}</div>
        ) : null}
      </div>
      <div style={{ width: 400, height: '100%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {pattern ? <SeparatorPattern pattern={pattern} /> : null}
      </div>
    </div>
  );
}
