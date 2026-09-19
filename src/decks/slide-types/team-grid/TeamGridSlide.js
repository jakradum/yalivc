import { TeamCard } from '@/decks/design-system/blocks/TeamCard/TeamCard';
import { VertLabel } from '@/decks/design-system/blocks/VertLabel/VertLabel';

// Ports .team-overview slide — vertical section label + grid of TeamCard.
export function TeamGridSlide({ label, people = [] }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', padding: '24px 40px 24px 60px' }}>
      {label ? <VertLabel text={label} /> : null}
      {/* single row, not capped at 4 — a 2-row wrap overflowed the fixed
          540px slide height with 7 people. Column width shrinks with
          count, which also shrinks the aspect-ratio-square photos. */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${people.length}, 1fr)`, gap: 12 }}>
        {people.map((p) => (
          <TeamCard key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}
