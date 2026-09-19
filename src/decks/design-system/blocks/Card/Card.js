// Generic bordered box — ports the legacy "border:1px solid #363636"
// container pattern used all over the deck (deployment line items,
// key-terms rows, etc). Deliberately plain: layout is the caller's job.
export function Card({ accent, children }) {
  return (
    <div style={{ border: 'var(--deck-border)', display: 'flex', alignItems: 'stretch' }}>
      {accent ? <div style={{ background: accent, width: 6, flexShrink: 0 }} /> : null}
      <div style={{ padding: '18px 24px', flex: 1 }}>{children}</div>
    </div>
  );
}
