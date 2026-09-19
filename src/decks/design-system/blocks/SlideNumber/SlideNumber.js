// Ports .slide-num. Simplified from the legacy auto-computed version
// (which walks the whole DOM and skips cover/divider slides) — here the
// skip logic is the caller's job via the `hidden` prop, driven by the
// deck manifest rather than a runtime DOM walk. Number is passed in, not
// computed client-side.
export function SlideNumber({ number, dark = false, hidden = false }) {
  if (hidden) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        right: 18,
        fontFamily: 'var(--deck-font-mono)',
        fontSize: 10,
        color: dark ? '#efefef' : '#363636',
      }}
    >
      {number}
    </div>
  );
}
