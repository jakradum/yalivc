import { CompanyCard } from '@/decks/design-system/blocks/CompanyCard/CompanyCard';

// Pixel-matched to legacy .fi-cards/.fi-grid-3/.fi-grid-4: 20px padding +
// 2 rows of fixed 244px cards + 12px gap = exactly 540px — the full
// slide height, with no separate heading row. The heading has to overlay
// (absolute), not sit in normal flow above the grid, or the two rows
// overflow the canvas (found via the export overflow check).
export function PortfolioGridSlide({ heading, companies = [], columns = 4 }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', position: 'relative' }}>
      {heading ? (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 20,
            zIndex: 1,
            fontFamily: 'var(--deck-font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--deck-color-crimson)',
          }}
        >
          {heading}
        </div>
      ) : null}
      <div style={{ width: '100%', height: '100%', padding: 20, background: '#ededeb', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12, width: '100%' }}>
          {companies.map((c) => (
            <CompanyCard key={c.name} {...c} />
          ))}
        </div>
      </div>
    </div>
  );
}
