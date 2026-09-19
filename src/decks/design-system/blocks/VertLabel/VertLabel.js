// Pixel-matched to .team-vert-label/.team-vert-text — a normal 44px-wide
// flex sibling (not absolutely positioned, which an earlier version had;
// this is the only real usage of this pattern in the legacy deck).
export function VertLabel({ text, color = 'var(--deck-color-ink)' }) {
  return (
    <div style={{ width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span
        style={{
          fontFamily: 'var(--deck-font-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}
      >
        {text}
      </span>
    </div>
  );
}
