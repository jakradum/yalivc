// Pixel-matched to legacy .fi-perf: crimson date/unit header over a crimson
// rule, then a full-height list of label/value rows separated by 1px rules
// (rows share the remaining height equally, as the legacy table did).
// With `columns` (e.g. ["As of Sep '26", "Current (post exits)"]) each row
// carries `values` instead of `value`, one per column, under a column header
// row. A row with `group: true` is a bold label with no values; `indent: true`
// rows sit under it (Sunil's snapshot splits active vs fully exited this way).
// A later-column value that differs from the first column's gets a solid gold
// marker behind it (bold ink on top), so readers see at a glance what moved;
// crimson was ruled out because the headers already use it. The 48px bottom
// pad keeps the last row clear of the page number.
const COL_W = 150;
const Changed = ({ children }) => (
  <span style={{ display: 'inline-block', minWidth: 64, boxSizing: 'border-box', background: 'var(--deck-color-gold)', fontWeight: 700, padding: '2px 6px', marginRight: -6 }}>{children}</span>
);

export function FundStatsSlide({ heading, unit, columns, rows = [] }) {
  const cells = (r) => (columns ? r.values || [] : [r.value]);
  const total = rows.length + (columns ? 1 : 0);
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: '32px 52px 48px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>{heading}</span>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>{unit}</span>
      </div>
      <div style={{ borderTop: '1px solid var(--deck-color-crimson)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: `repeat(${total || 1}, 1fr)` }}>
        {columns ? (
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--deck-color-ink)', fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>
            <span style={{ flex: 1 }} />
            {columns.map((c) => (
              <span key={c} style={{ width: COL_W, textAlign: 'right', paddingRight: 6, boxSizing: 'border-box' }}>{c}</span>
            ))}
          </div>
        ) : null}
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < rows.length - 1 && !r.group ? '1px solid var(--deck-color-ink)' : 'none', fontFamily: 'var(--deck-font-mono)', fontSize: 11, color: 'var(--deck-color-ink)' }}>
            <span style={{ flex: 1, paddingLeft: r.indent ? 20 : 0, fontWeight: r.group ? 700 : 400 }}>{r.label}</span>
            {r.group
              ? null
              : cells(r).map((v, j) => (
                  <span key={j} style={columns ? { width: COL_W, textAlign: 'right', paddingRight: 6, boxSizing: 'border-box' } : undefined}>
                    {columns && j > 0 && v !== r.values[0] ? <Changed>{v}</Changed> : v}
                  </span>
                ))}
          </div>
        ))}
      </div>
    </div>
  );
}
