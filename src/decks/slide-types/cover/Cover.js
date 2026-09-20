// Pixel-matched to legacy .s1/.s1-strip/.s1-body/.s1-logo/.s1-eyebrow/
// .s1-name/.s1-sub/.s1-tag. The left strip's hex pattern (#hex-cover) is
// a third, distinct pattern bank from the team-photo and separator ones,
// ported as Honeycomb.
import { Honeycomb } from '@/decks/design-system/blocks/Honeycomb/Honeycomb';

export function Cover({ title, numeral, subtitle, eyebrow, tag }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--deck-color-crimson)' }}>
      <div style={{ width: 110, flexShrink: 0, position: 'relative', overflow: 'hidden', background: 'var(--deck-color-crimson)' }}>
        <Honeycomb width={110} height={540} opacity={0.7} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.svg" alt="Yali Capital" style={{ width: 130, filter: 'brightness(0) invert(1)' }} />
        {eyebrow ? (
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(235,222,132,0.65)' }}>
            {eyebrow}
          </div>
        ) : null}
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 38, fontWeight: 400, color: '#fff', letterSpacing: '0.01em' }}>
          {title}
          {numeral ? <span style={{ fontSize: 28, opacity: 0.7 }}> {numeral}</span> : null}
        </div>
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>{subtitle}</div>
        {tag ? (
          <div
            style={{
              marginTop: 16,
              fontFamily: 'var(--deck-font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--deck-color-gold)',
              border: '1px solid rgba(235,222,132,0.45)',
              padding: '5px 14px',
            }}
          >
            {tag}
          </div>
        ) : null}
      </div>
    </div>
  );
}
