import { CompanyCard } from '@/decks/design-system/blocks/CompanyCard/CompanyCard';

// Pixel-matched to legacy .fi-apdx / .fi-grid-apdx-3 / .fi-grid-apdx-4:
// 18px 20px padding, 10px gap, cards auto-height and the row centred
// vertically. Legacy has NO header on these slides (`.fi-apdx-hdr` exists
// in its CSS but is never used), so there isn't one here — an earlier
// version overlaid a label that ran into the cards. One row per slide:
// the manifest splits companies 4 + 3, and `columns` follows the count.
export function PortfolioGridSlide({ companies = [], columns }) {
  const cols = columns || Math.min(Math.max(companies.length, 1), 4);
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: '18px 20px', background: '#ededeb', display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, width: '100%' }}>
        {companies.map((c) => (
          <CompanyCard key={c.name} {...c} compact />
        ))}
      </div>
    </div>
  );
}
