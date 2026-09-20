// Rebuilt from the real legacy markup — a 12-week cadence dot row per
// frequency (filled every Nth dot), not a plain text table as the
// earlier draft had. Interval per cadence read directly off the real
// SVG dot pattern: Weekly=1, Fortnightly=2, Monthly=4, Quarterly=12.
function CadenceDots({ interval }) {
  return (
    <svg width={260} height={14} viewBox="0 0 260 14">
      {Array.from({ length: 12 }, (_, i) => {
        const filled = i % interval === 0;
        const cx = 7 + i * 22;
        return filled ? (
          <circle key={i} cx={cx} cy={7} r={5} fill="var(--deck-color-crimson)" />
        ) : (
          <circle key={i} cx={cx} cy={7} r={5} fill="none" stroke="#d0cbc6" strokeWidth={1.5} />
        );
      })}
    </svg>
  );
}

export function PortfolioSupportSlide({ heading, cadences = [], note }) {
  return (
    <div style={{ padding: '22px 40px 18px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 16, flexShrink: 0 }}>
        {heading}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 260px', borderBottom: 'var(--deck-border)', paddingBottom: 8, flexShrink: 0 }}>
        {['Frequency', 'Portfolio Stage', '12-Week Cadence View'].map((h) => (
          <div key={h} style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa' }}>{h}</div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
        {cadences.map((c, i) => (
          <div key={c.frequency} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', padding: '18px 0', borderBottom: i < cadences.length - 1 ? 'var(--deck-border)' : 'none' }}>
            <div>
              <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 18, fontWeight: 700, color: i === 0 ? 'var(--deck-color-crimson)' : 'var(--deck-color-ink)' }}>{c.frequency}</div>
              <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 10, color: '#888', marginTop: 4, lineHeight: 1.4 }}>{c.description}</div>
            </div>
            <CadenceDots interval={c.interval} />
          </div>
        ))}
      </div>

      {note ? (
        <div style={{ background: 'var(--deck-color-crimson)', margin: '12px -40px -18px', padding: '13px 40px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, opacity: 0.7 }}>
            <rect x="1" y="4" width="16" height="11" rx="0" stroke="#ebde84" strokeWidth="1.4" />
            <line x1="1" y1="7.5" x2="17" y2="7.5" stroke="#ebde84" strokeWidth="1.2" />
            <line x1="6" y1="4" x2="6" y2="2" stroke="#ebde84" strokeWidth="1.4" />
            <line x1="12" y1="4" x2="12" y2="2" stroke="#ebde84" strokeWidth="1.4" />
          </svg>
          <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, color: '#efefef', letterSpacing: '0.08em' }}>{note}</span>
        </div>
      ) : null}
    </div>
  );
}
