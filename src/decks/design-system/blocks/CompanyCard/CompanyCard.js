// Props match the real `company` Sanity schema fields directly
// (name, logoUrl, sector, investmentStatus) — this is the component that
// closes the C2i-exit drift gap from Phase 0: status renders from data,
// not from someone remembering to edit a slide.
const STATUS_LABEL = { active: null, exited: 'Exited', 'written-off': 'Written Off' };

export function CompanyCard({ name, logoUrl, sector, investmentStatus = 'active' }) {
  const badge = STATUS_LABEL[investmentStatus];
  return (
    <div style={{ border: 'var(--deck-border)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
      {badge ? (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontFamily: 'var(--deck-font-mono)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: 'var(--deck-color-crimson)',
            color: '#fff',
            padding: '2px 6px',
          }}
        >
          {badge}
        </div>
      ) : null}
      <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} style={{ maxHeight: 40, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, fontSize: 13 }}>{name}</span>
        )}
      </div>
      {sector ? (
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 10, color: '#777' }}>{sector}</div>
      ) : null}
    </div>
  );
}
