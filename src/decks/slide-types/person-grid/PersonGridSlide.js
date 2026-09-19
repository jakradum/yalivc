import { PersonProfile } from '@/decks/design-system/blocks/PersonProfile/PersonProfile';
import { VertLabel } from '@/decks/design-system/blocks/VertLabel/VertLabel';

// Ports .person-slide (Investments Team / Operations Team) — crimson bg,
// a row of PersonProfile.
export function PersonGridSlide({ label, people = [] }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'var(--deck-color-crimson)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        padding: '24px 60px',
      }}
    >
      {label ? <VertLabel text={label} color="rgba(255,255,255,0.6)" /> : null}
      {people.map((p) => (
        <PersonProfile key={p.name} {...p} />
      ))}
    </div>
  );
}
