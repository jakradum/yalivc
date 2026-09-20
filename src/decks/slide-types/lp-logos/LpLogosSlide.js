// Pixel-matched to the legacy "MARQUEE LP LOGOS" slide: heading, a small
// group label, a row of five bordered white logo boxes (90px tall, logo max
// 52px), and a closing line. Which LPs appear is a curated, code-owned list;
// logos are read from the matching Sanity `investor` documents.
export function LpLogosSlide({ heading, groupLabel, logos = [], note }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, padding: '22px 36px 20px' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>{heading}</div>
      {groupLabel ? (
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>{groupLabel}</div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {logos.map((l) => (
          <div key={l.name} style={{ border: 'var(--deck-border)', height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#fff', boxSizing: 'border-box' }}>
            {l.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.logoUrl} alt={l.name} style={{ maxWidth: '100%', maxHeight: 52, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--deck-color-ink)' }}>{l.name}</span>
            )}
          </div>
        ))}
      </div>
      {note ? <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 13, color: '#555', marginTop: 8 }}>{note}</div> : null}
    </div>
  );
}
