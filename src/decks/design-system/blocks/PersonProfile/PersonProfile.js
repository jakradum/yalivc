// Pixel-matched to legacy .person-col/.person-photo/.name-tag/.person-name/
// .person-bio (fund2-deck-v2.0.html). Pattern background (.pat-bg) not
// ported — decorative, JS-tiled SVG, separate follow-up.
export function PersonProfile({ name, photoUrl, employers = [] }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', height: 260, position: 'relative', overflow: 'hidden', background: 'var(--deck-color-crimson)', flexShrink: 0 }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', position: 'relative', zIndex: 1 }} />
        ) : null}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            background: 'var(--deck-color-gold)',
            color: 'var(--deck-color-ink)',
            fontFamily: 'var(--deck-font-mono)',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 10px',
            letterSpacing: '0.04em',
            zIndex: 2,
          }}
        >
          {name}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--deck-color-gold)', marginTop: 12, marginBottom: 8 }}>
        {name}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {employers.map((emp) => (
          <li key={emp} style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, color: '#fff', paddingLeft: 14, position: 'relative', lineHeight: 1.4 }}>
            <span style={{ position: 'absolute', left: 0, color: 'var(--deck-color-gold)' }}>▪</span>
            {emp}
          </li>
        ))}
      </ul>
    </div>
  );
}
