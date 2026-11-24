// Fund I realised exits: one row per exited company (logo, name, how it
// exited, invested, exit value, MOIC) and a totals row. Header matches the
// fund-stats slide (crimson heading and unit over a crimson rule). The total
// is passed in, not summed here, so it can match the fund snapshot to the
// rupee where per-company figures round differently (514.15 vs 514.16).
const COLS = '1fr 150px 150px 110px';

const num = { fontFamily: 'var(--deck-font-mono)', textAlign: 'right', color: 'var(--deck-color-ink)' };

export function RealisedExitsSlide({ heading, unit, rows = [], total }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: '32px 52px 48px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>{heading}</span>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>{unit}</span>
      </div>
      <div style={{ borderTop: '1px solid var(--deck-color-crimson)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'end', paddingBottom: 10, borderBottom: '1px solid var(--deck-color-ink)', fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>
          <span>Company</span>
          <span style={{ textAlign: 'right' }}>Invested</span>
          <span style={{ textAlign: 'right' }}>Exit value</span>
          <span style={{ textAlign: 'right' }}>MOIC</span>
        </div>
        {rows.map((r) => (
          <div key={r.name} style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '22px 0', borderBottom: '1px solid var(--deck-color-ink)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, border: 'var(--deck-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 7, boxSizing: 'border-box', background: '#fff', flexShrink: 0 }}>
                {r.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.logoUrl} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : null}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 17, fontWeight: 700, color: 'var(--deck-color-ink)' }}>{r.name}</div>
                {r.note ? <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 12, color: '#555', marginTop: 4 }}>{r.note}</div> : null}
              </div>
            </div>
            <span style={{ ...num, fontSize: 22 }}>{r.invested}</span>
            <span style={{ ...num, fontSize: 22 }}>{r.exitValue}</span>
            <span style={{ ...num, fontSize: 22, fontWeight: 700 }}>{r.moic}</span>
          </div>
        ))}
        {total ? (
          <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '20px 0 0', borderTop: '1px solid var(--deck-color-ink)', marginTop: 3 }}>
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>Total</span>
            <span style={{ ...num, fontSize: 26, fontWeight: 700 }}>{total.invested}</span>
            <span style={{ ...num, fontSize: 26, fontWeight: 700 }}>{total.exitValue}</span>
            <span style={{ ...num, fontSize: 26, fontWeight: 700 }}>{total.moic}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
