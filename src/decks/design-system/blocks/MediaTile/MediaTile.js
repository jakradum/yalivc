// Pixel-matched to .s-media-tile, including the dark/gold "video" variant.
export function MediaTile({ publication, headline, date, href, isVideo = false }) {
  const dark = isVideo;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        border: `1px solid ${dark ? '#3a1020' : 'var(--deck-color-ink)'}`,
        padding: '10px 12px',
        overflow: 'hidden',
        background: dark ? '#1a0a10' : '#fff',
        textDecoration: 'none',
      }}
    >
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: dark ? 'var(--deck-color-gold)' : 'var(--deck-color-crimson)', flexShrink: 0 }}>
        {publication}
      </div>
      <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 9.5, color: dark ? 'rgba(255,255,255,0.85)' : 'var(--deck-color-ink)', lineHeight: 1.45, flex: 1 }}>
        {headline}
      </div>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7.5, color: dark ? 'rgba(255,255,255,0.35)' : '#bbb', flexShrink: 0 }}>
        {date}
      </div>
    </a>
  );
}
