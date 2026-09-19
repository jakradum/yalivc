// Pixel-matched to the REAL legacy .fi-port/.fi-port-table (the actual
// "Fund I Portfolio" slide — .fi-card/.fi-cards, read earlier, turned out
// to belong to the Appendix slide instead, a real mis-mapping found via
// the export overflow check). Columns: logo / company+sector / invested
// / MOIC / FMV / first investment date.
const COLS = '44px 1fr 120px 88px 88px 110px';

export function PortfolioTable({ heading, asOf, rows = [] }) {
  return (
    <div style={{ padding: '22px 36px 18px', background: '#efefef', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>{heading}</span>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, color: '#888' }}>{asOf}</span>
      </div>
      <div style={{ flex: 1, border: 'var(--deck-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COLS, borderBottom: 'var(--deck-border)', background: 'var(--deck-color-ink)', flexShrink: 0 }}>
          {['', 'Company', 'Invested', 'MOIC', 'FMV', 'First Investment'].map((h) => (
            <span key={h} style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#efefef', padding: '7px 10px' }}>{h}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={r.name} style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', flex: 1, minHeight: 0, borderTop: i > 0 ? '0.5px solid var(--deck-color-ink)' : undefined }}>
            <div style={{ width: 44, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRight: 'var(--deck-border)' }}>
              {r.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.logoUrl} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : null}
            </div>
            <div style={{ padding: '0 12px', borderRight: 'var(--deck-border)', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--deck-color-ink)' }}>{r.name}</div>
              {r.sector ? <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 8, color: 'var(--deck-color-crimson)', marginTop: 2 }}>{r.sector}</div> : null}
            </div>
            {[r.invested, r.moic, r.fmv].map((val, j) => (
              <div key={j} style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--deck-color-crimson)', padding: '0 12px', borderRight: 'var(--deck-border)', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                {val || '—'}
              </div>
            ))}
            <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--deck-color-crimson)', padding: '0 12px', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 400, fontSize: 10, color: '#888' }}>{r.firstInvestment || '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
