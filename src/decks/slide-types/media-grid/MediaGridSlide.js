import { MediaTile } from '@/decks/design-system/blocks/MediaTile/MediaTile';

// Pixel-matched to .s-media/.s-media-label/.s-media-grid (4x3 grid).
export function MediaGridSlide({ heading, items = [] }) {
  return (
    <div style={{ padding: '26px 36px 20px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 12, flexShrink: 0 }}>
        {heading}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: 10 }}>
        {items.map((item) => (
          <MediaTile key={item.headline} {...item} />
        ))}
      </div>
    </div>
  );
}
