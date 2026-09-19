import { CompanyCard } from '@/decks/design-system/blocks/CompanyCard/CompanyCard';

// Ports .fi-port / .fi-cards grids (Fund I Portfolio, Appendix).
export function PortfolioGridSlide({ heading, companies = [], columns = 4 }) {
  return (
    <div style={{ padding: '24px 40px', width: '100%', height: '100%', boxSizing: 'border-box' }}>
      {heading ? (
        <div
          style={{
            fontFamily: 'var(--deck-font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--deck-color-crimson)',
            marginBottom: 20,
          }}
        >
          {heading}
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 14 }}>
        {companies.map((c) => (
          <CompanyCard key={c.name} {...c} />
        ))}
      </div>
    </div>
  );
}
