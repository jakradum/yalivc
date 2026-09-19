// Pixel-matched to legacy .team-card/.team-photo/.exp-badge/.team-name —
// aspect-ratio 3/2.4 (was 1/1) and the grayscale+contrast photo filter
// were both missing from the earlier draft.
export function TeamCard({ name, photoUrl, experienceBadge, badgeTone = 'crimson' }) {
  const badgeBg = badgeTone === 'crimson' ? 'var(--deck-color-crimson)' : '#fff';
  const badgeFg = badgeTone === 'crimson' ? 'var(--deck-color-gold)' : 'var(--deck-color-ink)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', flex: 1, background: '#e4dfd9', position: 'relative', overflow: 'hidden', aspectRatio: '3 / 2.4' }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', position: 'relative', zIndex: 1, filter: 'grayscale(1) contrast(1.15)' }}
          />
        ) : null}
        {experienceBadge ? (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              fontFamily: 'var(--deck-font-mono)',
              fontSize: 8,
              padding: '3px 7px',
              letterSpacing: '0.04em',
              zIndex: 2,
              background: badgeBg,
              color: badgeFg,
            }}
          >
            {experienceBadge}
          </div>
        ) : null}
      </div>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-ink)', marginTop: 5, letterSpacing: '0.01em' }}>
        {name}
      </div>
    </div>
  );
}
