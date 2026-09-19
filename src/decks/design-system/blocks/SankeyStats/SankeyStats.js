// Ports .fi-sankey-stats — a row of big-number stats with rules between
// them (fund composition summary). Simplified: legacy also has a Sankey
// diagram (.fi-sankey-right) not ported here — flagged as a follow-up,
// low-reuse bespoke visual per the "don't componentize every div" rule.
export function SankeyStats({ stats = [] }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {i > 0 ? <div style={{ width: 1, height: 40, background: 'var(--deck-color-ink)', opacity: 0.3 }} /> : null}
          <div>
            <div style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, fontSize: 26 }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 10, color: '#777' }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
