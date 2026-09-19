import { PieChart } from '@/decks/design-system/blocks/PieChart/PieChart';

// Pixel-matched to .fi-pie: heading is absolutely positioned (matches
// the pattern already found for the portfolio table/grid — legacy's pie
// slide has no separate heading row in its flex layout either), chart
// fills the remaining height.
export function DeploymentSlide({ heading, allocation = [] }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', position: 'relative' }}>
      {heading ? (
        <div style={{ position: 'absolute', top: 22, left: 40, fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>
          {heading}
        </div>
      ) : null}
      <div style={{ padding: '28px 48px 28px 40px', width: '100%', height: '100%', boxSizing: 'border-box' }}>
        <PieChart allocation={allocation} />
      </div>
    </div>
  );
}
