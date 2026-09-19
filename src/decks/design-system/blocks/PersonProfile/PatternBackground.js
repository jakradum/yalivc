// Faithful port of the legacy team-photo pattern bank (fund2-deck-v2.0.html,
// "Team photo patterns (explicit paths, PDF-safe)" IIFE) — exact path data,
// exact tiling math, exact opacity/stroke. Rendered as real SVG elements
// (not a CSS background-image pattern), per docs/CLAUDE.md's rule that
// CSS/`<pattern>`-based SVG patterns break in Chrome-to-PDF.
const W = 500;
const H = 260;

const PATH_DATA = {
  1: "M-.02 22c8.373 0 11.938-4.695 16.32-9.662C20.785 7.258 25.728 2 35 2c9.272 0 14.215 5.258 18.7 10.338C58.082 17.305 61.647 22 70.02 22M-.02 14.002C8.353 14 11.918 9.306 16.3 4.339 20.785-.742 25.728-6 35-6 44.272-6 49.215-.742 53.7 4.339c4.382 4.967 7.947 9.661 16.32 9.664M70 6.004c-8.373-.001-11.918-4.698-16.3-9.665C49.215-8.742 44.272-14 35-14c-9.272 0-14.215 5.258-18.7 10.339C11.918 1.306 8.353 6-.02 6.002",
  3: "M20 30a10 10 0 110-20 10 10 0 010 20z",
  4: "M28.996 33.716L0 16.976.004-16.514l29-16.748L58-16.52l-.004 33.49zm0 100.12L0 117.096l.004-33.49 29-16.746L58 83.6l-.004 33.488zM57.992 83.6l-28.996-16.74.004-33.488L58 16.624l28.996 16.74-.004 33.49zm-58 0l-28.996-16.74.004-33.488L0 16.624l28.996 16.74-.004 33.49z",
  5: "M46.189-20L57.736 0M46.189 20l11.547 20m-46.189 0l11.547 20M11.547 0l11.547 20m40.415 30H40.415M28.868 30H5.774m23.094-40H5.774m57.735 20H40.415m0 20L28.868 50m11.547-60L28.868 10m46.188 0L63.509 30M5.774 10L-5.773 30m75.056 10H46.189L34.64 20 46.19 0h23.094C73.13 6.667 76.98 13.333 80.83 20zM57.736 60H34.64L23.094 40l11.547-20h23.095c3.848 6.667 7.698 13.333 11.547 20L57.736 60zm0-40H34.64L23.094 0l11.547-20h23.095L69.283 0c-3.87 6.7-8.118 14.06-11.547 20zM34.64 60H11.547L0 40l11.547-20h23.094L46.19 40 34.64 60zm0-40H11.547L0 0l11.547-20h23.094L46.19 0 34.64 20zM23.094 40H0l-5.773-10-5.774-10L0 0h23.094l11.547 20-11.547 20z",
  6: "M121.5 39.5V9.169c0-2.827 1.724-4.707 3.473-5.602l.707-.362c2.086-1.068 4.702-.631 6.359 1.026l1.985 1.985c1.349 1.349 3.235 2.018 5.14 2.128 12.336 0 12.336-18.505 0-18.505",
  7: "m23.67 15 8.66-15 15.02 8.66-8.67 15.01Zm0-30 8.66 15 15.02-8.66-8.67-15.01zM0-8.33v17m47.35-17v17M15.01 0h17.32m-8.66 32.8 8.66 15 15.02-8.66-8.67-15.01zM0 39.47v17m47.35-17v17M15.01 47.8h17.32m-56-32.8L-15 0 0 8.65l-8.66 15.01Zm47.35 0L15 0 0 8.65l8.67 15.01Zm0-30L15 0 0-8.66l8.67-15.01Zm47.33 30L62.35 0 47.33 8.65 56 23.67ZM23.67 62.8l8.66-15 15.02 8.66-8.67 15.01zm47.34-30-8.66 15-15.02-8.66L56 24.13Zm-47.33 30L15 47.8 0 56.45l8.67 15.01Zm-47.35-30 8.67 15 15-8.65-8.66-15.01zm47.35 0L15 47.8 0 39.15l8.67-15.01Z",
};

function tilesFor(patNum) {
  const tiles = []; // { d, tx, ty, scale }
  if (patNum === 1) {
    for (let ty = -24; ty < H / 2 + 24; ty += 8)
      for (let tx = -70; tx < W / 2 + 70; tx += 70) tiles.push({ d: PATH_DATA[1], tx, ty, scale: 2 });
  } else if (patNum === 3) {
    for (let ty = -40; ty < H + 40; ty += 40)
      for (let tx = -40; tx < W + 40; tx += 40) tiles.push({ d: PATH_DATA[3], tx, ty, scale: 2 });
  } else if (patNum === 4) {
    for (let ty = -100.23; ty < H + 100.23; ty += 100.23)
      for (let tx = -58; tx < W + 58; tx += 58) tiles.push({ d: PATH_DATA[4], tx, ty, scale: 1 });
  } else if (patNum === 5) {
    for (let ty = -80; ty < H / 2 + 80; ty += 40)
      for (let tx = -138.566; tx < W / 2 + 138.566; tx += 69.283) tiles.push({ d: PATH_DATA[5], tx, ty, scale: 2 });
  } else if (patNum === 6) {
    for (let ty = -160; ty < H + 160; ty += 160)
      for (let tx = -160; tx < W + 160; tx += 160) tiles.push({ d: PATH_DATA[6], tx, ty, scale: 1 });
  } else if (patNum === 7) {
    for (let ty = -95.6; ty < H / 2 + 95.6; ty += 47.8)
      for (let tx = -94.7; tx < W / 2 + 94.7; tx += 47.35) tiles.push({ d: PATH_DATA[7], tx, ty, scale: 2 });
  }
  return tiles;
}

// Pattern 2 (rotated grid of lines) has no path data — built from lines.
function gridLines() {
  const lines = [];
  for (let gy = -H; gy < H * 2; gy += 40) {
    for (let gx = -W; gx < W * 2; gx += 40) {
      lines.push({ x1: gx + 20, y1: gy, x2: gx + 20, y2: gy + 40 });
      lines.push({ x1: gx, y1: gy + 20, x2: gx + 40, y2: gy + 20 });
    }
  }
  return lines;
}

export function PatternBackground({ patNum }) {
  if (!patNum || patNum < 1 || patNum > 7) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
      <g opacity={0.7}>
        {patNum === 2 ? (
          <g transform={`rotate(60,${W / 2},${H / 2})`}>
            {gridLines().map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#ebde84" strokeWidth={0.5} />
            ))}
          </g>
        ) : (
          tilesFor(patNum).map((t, i) => (
            <path
              key={i}
              d={t.d}
              transform={`translate(${t.tx},${t.ty})${t.scale !== 1 ? ` scale(${t.scale})` : ''}`}
              stroke="#ebde84"
              strokeWidth={0.5}
              fill="none"
            />
          ))
        )}
      </g>
    </svg>
  );
}
