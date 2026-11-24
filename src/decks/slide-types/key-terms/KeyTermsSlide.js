// Pixel-matched to the legacy Fund II Key Terms slide's actual structure
// (fund2-deck-v2.0.html:1998-2023): it's bespoke inline-styled markup,
// not a row of stat tiles like the earlier draft assumed — one highlight
// box (fund size + greenshoe) followed by a 2-row bordered table. The
// greenshoe was a small gold pill in legacy; it's now set at the fund size's
// own 32px so the two amounts read with equal weight.
function TermRow({ label, value, first }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', borderBottom: first ? '1px solid var(--deck-color-ink)' : 'none' }}>
      <div style={{ padding: '13px 16px', borderRight: '1px solid var(--deck-color-ink)', background: '#f5f5f5' }}>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-ink)' }}>{label}</span>
      </div>
      <div style={{ padding: '13px 16px' }}>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, color: 'var(--deck-color-ink)' }}>{value}</span>
      </div>
    </div>
  );
}

export function KeyTermsSlide({ heading, fundSizeLabel, greenshoeLabel, fundTerm, investmentPeriodYears }) {
  return (
    <div style={{ padding: '44px 60px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 28 }}>
        {heading}
      </div>

      <div style={{ border: 'var(--deck-border)', padding: '22px 28px', marginBottom: 28, minWidth: 340 }}>
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 10 }}>
          Target Fund Size
        </div>
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1 }}>
          {fundSizeLabel}
        </div>
        {greenshoeLabel ? (
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1, marginTop: 12 }}>
            {greenshoeLabel}
          </div>
        ) : null}
      </div>

      <div style={{ border: 'var(--deck-border)', minWidth: 340 }}>
        <TermRow label="Term" value={fundTerm} first />
        <TermRow label="Commitment Period" value={`${investmentPeriodYears} Years`} />
      </div>
    </div>
  );
}
