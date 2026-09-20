// Rebuilt from the real end-slide markup — legacy uses the full
// yali-logo.png lockup (not the favicon mark), a "Thank You" headline,
// and real contact links, not a bare logomark as the Phase 3 draft had.
export function ClosingSlide({ contacts = [], website }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--deck-color-crimson)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/yali-logo.png" alt="Yali Capital" style={{ filter: 'brightness(0) invert(1)', marginBottom: 32, width: 130 }} />
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 48, fontWeight: 400, color: '#fff', letterSpacing: '0.01em', marginBottom: 36 }}>
        Thank You
      </div>
      <div style={{ width: 48, height: 1, background: 'rgba(235,222,132,0.45)', marginBottom: 32 }} />
      <div style={{ display: 'flex', gap: 36, fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
        {contacts.map((c, i) => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {i > 0 ? <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span> : null}
            <a href={`mailto:${c}`} style={{ color: 'rgba(235,222,132,0.75)', textDecoration: 'none' }}>{c}</a>
          </div>
        ))}
      </div>
      {website ? (
        <div style={{ marginTop: 14, fontFamily: 'var(--deck-font-mono)', fontSize: 10, letterSpacing: '0.14em' }}>
          <a href={`https://${website}`} target="_blank" rel="noopener" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{website}</a>
        </div>
      ) : null}
    </div>
  );
}
