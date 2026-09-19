// Ports the legacy "fi-legend"/key-terms stat-box pattern into a reusable
// component (e.g. Target Fund Size, Greenshoe on the Key Terms slide).
export function StatTile({ label, value, sublabel, tone = 'default' }) {
  const bg = tone === 'accent' ? 'var(--deck-color-crimson)' : '#fff';
  const fg = tone === 'accent' ? '#fff' : 'var(--deck-color-ink)';
  return (
    <div style={{ border: 'var(--deck-border)', padding: '18px 22px', background: bg, color: fg }}>
      <div
        style={{
          fontFamily: 'var(--deck-font-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          opacity: 0.8,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </div>
      {sublabel ? (
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 11, opacity: 0.7, marginTop: 6 }}>
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}
