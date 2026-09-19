import { StatTile } from '@/decks/design-system/blocks/StatTile/StatTile';

// Ports the Key Terms slide — props shaped to match fund2Settings fields
// directly (targetFundSizeINR/USD, greenshoeINR, fundTerm,
// investmentPeriodYears) so Phase 5's Sanity wiring is a direct pass-through.
export function KeyTermsSlide({ heading, fundSizeLabel, greenshoeLabel, fundTerm, investmentPeriodYears }) {
  return (
    <div style={{ padding: '44px 60px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>
        {heading}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <StatTile label="Target Fund Size" value={fundSizeLabel} sublabel={greenshoeLabel} tone="accent" />
        <StatTile label="Term" value={fundTerm} />
        <StatTile label="Investment Period" value={`${investmentPeriodYears} Years`} />
      </div>
    </div>
  );
}
