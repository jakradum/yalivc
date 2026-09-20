import { PersonProfile } from '@/decks/design-system/blocks/PersonProfile/PersonProfile';

// Ports .person-slide (GPs & Advisor / Investments Team / Operations
// Team) — crimson bg, a row of PersonProfile. No label on this slide
// type in the legacy deck (that was a Phase 5 fabrication, removed) —
// only the team-overview slide has a vert-label.
export function PersonGridSlide({ people = [], maxWidth }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--deck-color-crimson)',
        display: 'flex',
        alignItems: 'flex-start',
        padding: 28, // legacy .persons-row: top-aligned, 28px padding, 20px gap
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: maxWidth || undefined, justifyContent: maxWidth ? 'flex-start' : 'center' }}>
        {people.map((p) => (
          <PersonProfile key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}
