// Ports .team-card (Team Overview grid) — photo with an experience badge
// overlay, name below. Badge tone alternates crimson/white in the legacy
// deck by eye, not by rule — exposed as a prop instead of guessed at.
export function TeamCard({ name, photoUrl, experienceBadge, badgeTone = 'crimson' }) {
  const badgeBg = badgeTone === 'crimson' ? 'var(--deck-color-crimson)' : '#fff';
  const badgeFg = badgeTone === 'crimson' ? '#fff' : 'var(--deck-color-ink)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden' }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#ddd' }} />
        )}
        {experienceBadge ? (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              right: 6,
              background: badgeBg,
              color: badgeFg,
              fontFamily: 'var(--deck-font-mono)',
              fontSize: 9,
              fontWeight: 700,
              padding: '4px 6px',
            }}
          >
            {experienceBadge}
          </div>
        ) : null}
      </div>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, fontSize: 12 }}>{name}</div>
    </div>
  );
}
