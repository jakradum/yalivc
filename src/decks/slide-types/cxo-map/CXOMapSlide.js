// Pixel-matched to the real legacy markup — correct heading ("Our LP
// network · Top global CXOs", not "Tech CXO Network" as the earlier
// draft had) and each country's region subtitle, which was missing.
// Flags are SVG files (public/flags), not emoji: serverless Chromium has no
// emoji font, so 🇮🇳 etc. rendered as blanks in the exported PDF. Unknown
// codes fall back to the emoji text.
const FLAG_FILE = { IND: 'in', USA: 'us', TWN: 'tw', KOR: 'kr', SGP: 'sg' };

function Flag({ code, flag, name }) {
  const file = FLAG_FILE[code];
  if (!file) return <div style={{ fontSize: 60, lineHeight: 1 }}>{flag}</div>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/flags/${file}.svg`} alt={`${name} flag`} width={64} height={48} style={{ display: 'block', boxShadow: '0 0 0 1px rgba(0,0,0,0.3)' }} />
  );
}

export function CXOMapSlide({ heading, countries = [], footnote }) {
  return (
    <div style={{ padding: '22px 36px 24px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', flexShrink: 0 }}>
        {heading}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {countries.map((c, i) => (
          <div key={c.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '0 8px', borderRight: i < countries.length - 1 ? '1px solid #d0d0d0' : 'none' }}>
            <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--deck-color-crimson)' }}>{c.code}</div>
            <Flag code={c.code} flag={c.flag} name={c.name} />
            <div>
              <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--deck-color-ink)', textAlign: 'center', letterSpacing: '0.04em' }}>{c.name}</div>
              <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 9, color: '#999', textAlign: 'center', marginTop: 3 }}>{c.region}</div>
            </div>
          </div>
        ))}
      </div>
      {footnote ? (
        <div style={{ flexShrink: 0, marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--deck-color-ink)', border: 'var(--deck-border)', padding: '8px 20px', textAlign: 'center' }}>
            {footnote}
          </div>
        </div>
      ) : null}
    </div>
  );
}
