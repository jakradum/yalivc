import { MediaTile } from '@/decks/design-system/blocks/MediaTile/MediaTile';

export function MediaGridSlide({ heading, items = [] }) {
  return (
    <div style={{ padding: '24px 40px', width: '100%', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
        {heading}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {items.map((item) => (
          <MediaTile key={item.headline} {...item} />
        ))}
      </div>
    </div>
  );
}
