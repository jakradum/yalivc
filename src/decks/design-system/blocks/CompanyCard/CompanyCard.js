// Pixel-matched to legacy .fi-card/.fi-card-header/.fi-card-logo/
// .fi-card-name/.fi-card-sector/.fi-card-desc/.fi-card-hr/.fi-card-metrics
// (fund2-deck-v2.0.html). The "Exited"/"Written Off" badge has NO legacy
// precedent — the legacy deck only ever has a code comment ("When first
// exit occurs, surface exited company at the top...") and never actually
// got a visual treatment. Keeping the badge (it's what closes the real
// C2i drift bug) but it's new design, not a pixel-match to anything.
// `compact` is the appendix variant (legacy .fi-card-apdx): auto height so a
// row of cards sizes to its longest description, smaller type, and wrapping
// metrics (six of them: Invested / FMV / MOIC / First Investment /
// Ownership / Stage).
const STATUS_LABEL = { active: null, exited: 'Exited', 'written-off': 'Written Off' };

export function CompanyCard({ name, logoUrl, sector, description, metrics = [], investmentStatus = 'active', compact = false }) {
  const badge = STATUS_LABEL[investmentStatus];
  return (
    <div style={{ background: '#fff', border: 'var(--deck-border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', height: compact ? undefined : 244 }}>
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
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: compact ? 6 : 8, flexShrink: 0 }}>
        <div style={{ width: 52, height: 52, border: 'var(--deck-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fff', padding: 3 }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>{name?.[0]}</span>
          )}
        </div>
        <div style={{ flex: 1, paddingTop: 2 }}>
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1.3 }}>{name}</div>
          {sector ? <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 8.5, color: 'var(--deck-color-crimson)', marginTop: 3 }}>{sector}</div> : null}
        </div>
      </div>
      {description ? (
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: compact ? 9.5 : 10.5, color: '#555', lineHeight: 1.55, marginBottom: compact ? 0 : 2, flex: 1 }}>{description}</div>
      ) : (
        <div style={{ flex: 1 }} />
      )}
      {metrics.length ? (
        <>
          <hr style={{ border: 'none', borderTop: 'var(--deck-border)', margin: compact ? '7px 0' : '8px 0', flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: compact ? 12 : 20, flexWrap: compact ? 'wrap' : undefined, flexShrink: 0 }}>
            {metrics.map((m) => (
              <div key={m.label}>
                <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: compact ? 7.5 : 8, color: '#aaa', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: compact ? 11 : 12, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>{m.value}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
