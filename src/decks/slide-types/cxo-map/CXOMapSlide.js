// Ports the Tech CXO Network Map — emoji flags, no D3/TopoJSON (legacy
// already dropped that in favor of this exact approach, per
// docs/CLAUDE.md).
export function CXOMapSlide({ heading, countries = [], footnote }) {
  return (
    <div style={{ padding: '24px 40px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        {heading}
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        {countries.map((c) => (
          <div key={c.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, borderRight: '1px solid #d0d0d0' }}>
            <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--deck-color-crimson)' }}>{c.code}</div>
            <div style={{ fontSize: 44 }}>{c.flag}</div>
            <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 12, fontWeight: 700 }}>{c.name}</div>
          </div>
        ))}
      </div>
      {footnote ? (
        <div style={{ alignSelf: 'center', fontFamily: 'var(--deck-font-mono)', fontSize: 11, border: 'var(--deck-border)', padding: '6px 16px' }}>
          {footnote}
        </div>
      ) : null}
    </div>
  );
}
