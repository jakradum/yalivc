// Ports the legacy "person-col" pattern (fund2-deck-v2.0.html, INVESTMENTS
// TEAM slide) into a reusable, prop-driven component. This directly
// replaces the hardcoded Karthik/Sandipan bios found in Phase 0 discovery.
export function PersonProfile({ name, photoUrl, employers = [], pattern = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          position: 'relative',
          width: 190,
          height: 190,
          overflow: 'hidden',
          background: 'var(--deck-color-ink)',
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontFamily: 'var(--deck-font-mono)',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {name}
        </div>
      </div>
      <div
        style={{
          fontFamily: 'var(--deck-font-mono)',
          fontWeight: 700,
          fontSize: 13,
          color: '#fff',
        }}
      >
        {name}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', textAlign: 'center' }}>
        {employers.map((emp) => (
          <li
            key={emp}
            style={{ fontFamily: 'var(--deck-font-body)', fontSize: 11, color: 'rgba(255,255,255,0.75)' }}
          >
            {emp}
          </li>
        ))}
      </ul>
    </div>
  );
}
