import { SankeyDiagram } from './SankeyDiagram';

// Pixel-matched to legacy .fi-sankey: a 200px left rail (title, sub, three
// big-number stats) with a rule on its right edge, and the Sankey centred in
// the rest.
export function DealflowSummarySlide({ title, sub, stats = [] }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 36px', borderRight: '1px solid var(--deck-color-ink)', boxSizing: 'border-box' }}>
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1.25, marginBottom: 6, whiteSpace: 'pre-line' }}>{title}</div>
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 9, color: '#888', marginBottom: 26, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{sub}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--deck-color-crimson)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8, color: '#888', lineHeight: 1.4 }}>{s.label}</div>
              {i < stats.length - 1 ? <div style={{ width: 120, height: 1, background: 'rgba(54,54,54,0.10)', marginTop: 3 }} /> : null}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 24px 36px 20px' }}>
        <SankeyDiagram />
      </div>
    </div>
  );
}
