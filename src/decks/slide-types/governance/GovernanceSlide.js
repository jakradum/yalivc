// Ports "Proposed Structure" — simplified into HTML boxes + a thin
// connector line, NOT the legacy's pure-SVG coordinate-exact diagram.
// A faithful pixel-for-pixel port belongs in Phase 6 fidelity work; this
// gets the real structure and real labels on the record now.
function Box({ title, sub, children }) {
  return (
    <div style={{ border: 'var(--deck-border)', padding: '10px 14px', textAlign: 'center', background: '#fff' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, fontSize: 11 }}>{title}</div>
      {sub ? <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 9, color: '#777' }}>{sub}</div> : null}
      {children}
    </div>
  );
}

export function GovernanceSlide({ heading, note }) {
  return (
    <div style={{ padding: '20px 40px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <div style={{ alignSelf: 'flex-start', fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>
        {heading}
      </div>
      <div style={{ display: 'flex', gap: 40 }}>
        <Box title="Domestic LPs" sub="HNIs · family offices · institutions" />
        <Box title="Overseas LPs" sub="NRIs · FPIs · foreign institutions" />
      </div>
      <div style={{ width: 1, height: 20, background: '#999' }} />
      <Box title="GIFT City Feeder Fund" sub="IFSCA registered · USD denominated" />
      <div style={{ width: 1, height: 20, background: '#999' }} />
      <Box title="AIF Fund II" sub="As approved in the PPM" />
      <div style={{ width: 1, height: 20, background: '#999' }} />
      <Box title="Portfolio" />
      {note ? (
        <div style={{ marginTop: 'auto', fontFamily: 'var(--deck-font-mono)', fontSize: 9, color: '#999' }}>{note}</div>
      ) : null}
    </div>
  );
}
