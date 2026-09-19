// Ports .vert-label/.team-vert-label — rotated section label along a
// slide's edge.
export function VertLabel({ text, side = 'left', color = '#999' }) {
  return (
    <div
      style={{
        position: 'absolute',
        [side]: 16,
        top: '50%',
        transform: `translateY(-50%) rotate(${side === 'left' ? '-90deg' : '90deg'})`,
        transformOrigin: 'center',
        fontFamily: 'var(--deck-font-mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
}
