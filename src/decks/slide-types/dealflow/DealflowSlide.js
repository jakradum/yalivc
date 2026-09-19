// Ports the Inbound Dealflow slide. Simplified from legacy's two-level
// dark-stage-box + colored-exit-badge layout into a single readable row —
// a genuinely bespoke slide (per the "don't componentize every div"
// rule), not a reusable block. Real stage/exit copy from legacy, not
// invented.
const EXIT_COLORS = { Ignore: '#999', Pass: '#a33', Watch: '#c98a2c', Park: '#555' };

export function DealflowSlide({ heading, stages = [] }) {
  return (
    <div style={{ padding: '24px 40px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>
        {heading}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {stages.map((s) => (
          <div key={s.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ background: '#2a2a2a', color: '#fff', padding: '10px 8px', fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>
              {s.name}
            </div>
            <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 9, color: '#777', textAlign: 'center' }}>{s.description}</div>
            {s.exit ? (
              <div style={{ background: EXIT_COLORS[s.exit] || '#999', color: '#fff', fontFamily: 'var(--deck-font-mono)', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '4px 6px' }}>
                {s.exit.toUpperCase()}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
