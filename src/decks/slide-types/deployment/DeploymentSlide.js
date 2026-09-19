import { PieChart } from '@/decks/design-system/blocks/PieChart/PieChart';

// Props match fund2Settings.deploymentStageAllocation directly.
export function DeploymentSlide({ heading, allocation = [] }) {
  return (
    <div style={{ padding: '44px 60px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>
        {heading}
      </div>
      <PieChart allocation={allocation} />
    </div>
  );
}
