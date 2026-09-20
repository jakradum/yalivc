// Faithful port of the legacy `fillHex` (fund2-deck-v2.0.html, "Hex pattern
// tile fill" IIFE) — same path, same 58×100.23 tiling, same 0.5 stroke.
// Explicit paths, no <pattern>, per docs/CLAUDE.md (patterns break in
// Chrome-to-PDF). Used by the cover strip (110×540 @ 0.7) and the
// contents panel (340×540 @ 0.45).
const D = 'M28.996 33.716L0 16.976.004-16.514l29-16.748L58-16.52l-.004 33.49zm0 100.12L0 117.096l.004-33.49 29-16.746L58 83.6l-.004 33.488zM57.992 83.6l-28.996-16.74.004-33.488L58 16.624l28.996 16.74-.004 33.49zm-58 0l-28.996-16.74.004-33.488L0 16.624l28.996 16.74-.004 33.49z';
const TW = 58;
const TH = 100.23;

export function Honeycomb({ width, height, opacity = 0.7, style }) {
  const tiles = [];
  for (let y = -TH; y < height + TH; y += TH) {
    for (let x = -TW; x < width + TW; x += TW) tiles.push({ x, y });
  }
  return (
    <svg
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: 0, left: 0, display: 'block', ...style }}
    >
      <g opacity={opacity}>
        {tiles.map((t, i) => (
          <path key={i} d={D} transform={`translate(${t.x},${t.y})`} stroke="#ebde85" strokeWidth={0.5} fill="none" />
        ))}
      </g>
    </svg>
  );
}
