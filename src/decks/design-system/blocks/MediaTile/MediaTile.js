// Ports .s-media-tile — a media/press mention card, optionally a video.
export function MediaTile({ publication, headline, date, href, isVideo = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        display: 'block',
        border: 'var(--deck-border)',
        padding: 14,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--deck-color-crimson)', textTransform: 'uppercase' }}>
        {publication} {isVideo ? '· Video' : ''}
      </div>
      <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 12, fontWeight: 700, margin: '6px 0' }}>{headline}</div>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, color: '#999' }}>{date}</div>
    </a>
  );
}
