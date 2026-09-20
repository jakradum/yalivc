// Pixel-matched to legacy .fi-perf: crimson date/unit header over a crimson
// rule, then a full-height list of label/value rows separated by 1px rules
// (rows share the remaining height equally, as the legacy table did).
export function FundStatsSlide({ heading, unit, rows = [] }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: '32px 52px 28px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>{heading}</span>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>{unit}</span>
      </div>
      <div style={{ borderTop: '1px solid var(--deck-color-crimson)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: `repeat(${rows.length || 1}, 1fr)` }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < rows.length - 1 ? '1px solid var(--deck-color-ink)' : 'none', fontFamily: 'var(--deck-font-mono)', fontSize: 11, color: 'var(--deck-color-ink)' }}>
            <span>{r.label}</span>
            <span>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
