import { CompanyCard } from '@/decks/design-system/blocks/CompanyCard/CompanyCard';

// Pixel-matched to legacy .fi-cards/.fi-grid-3/.fi-grid-4 (fixed 244px
// row height, 12px gap, #ededeb background, 20px padding).
export function PortfolioGridSlide({ heading, companies = [], columns = 4 }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {heading ? (
        <div
          style={{
            padding: '16px 20px 0',
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
      <div style={{ flex: 1, padding: 20, background: '#ededeb', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12, width: '100%' }}>
          {companies.map((c) => (
            <CompanyCard key={c.name} {...c} />
          ))}
        </div>
      </div>
    </div>
  );
}
