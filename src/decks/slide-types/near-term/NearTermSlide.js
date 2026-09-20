// Pixel-matched to the legacy "FUND I NEAR-TERM DEPLOYMENT" slide: two
// accent-barred line items on the left and a crimson "combined" total on the
// right. The total is the sum of the item amounts (₹200 + ₹15 = ₹215), so it
// can't drift from the items.
export function NearTermSlide({ heading, items = [], totalLabel = 'Combined' }) {
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 60px' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 32 }}>{heading}</div>
      <div style={{ display: 'flex', gap: 24, width: '100%', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {items.map((it) => (
            <div key={it.label} style={{ border: 'var(--deck-border)', display: 'flex', alignItems: 'stretch' }}>
              <div style={{ background: it.accent === 'ink' ? 'var(--deck-color-ink)' : 'var(--deck-color-crimson)', width: 6, flexShrink: 0 }} />
              <div style={{ padding: '18px 24px', flex: 1 }}>
                <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 8 }}>{it.label}</div>
                <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1, marginBottom: 6 }}>₹{it.amount} Crore</div>
                <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 12, color: '#555', lineHeight: 1.5 }}>{it.description}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ border: 'var(--deck-border)', background: 'var(--deck-color-crimson)', padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 200, alignSelf: 'stretch', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(235,222,132,0.75)', marginBottom: 14, textAlign: 'center' }}>{totalLabel}</div>
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--deck-color-gold)', lineHeight: 1, textAlign: 'center' }}>₹{total}</div>
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--deck-color-gold)', marginTop: 4, textAlign: 'center' }}>Crore</div>
        </div>
      </div>
    </div>
  );
}
