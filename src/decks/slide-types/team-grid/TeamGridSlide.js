import { TeamCard } from '@/decks/design-system/blocks/TeamCard/TeamCard';
import { VertLabel } from '@/decks/design-system/blocks/VertLabel/VertLabel';

// Pixel-matched to .team-overview/.team-grid — a FIXED 4-column x 2-row
// grid (not one row scaled to however many people there are, which is
// what an earlier version did and which badly broke once the real
// person count — 8, not 7 — was corrected).
export function TeamGridSlide({ label, people = [] }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}>
      <VertLabel text={label} color="var(--deck-color-ink)" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 10, padding: '18px 18px 18px 0' }}>
        {people.map((p) => (
          <TeamCard key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}
