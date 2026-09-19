// Pure functions only — no JSX. Unit-testable, and this is the layer a
// redesign round should touch: change diagram.config.js's angles/radii,
// not this math or the component markup.

export function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Lays out `count` items centered within an arc of `totalArcDeg`,
// starting at `startAngleDeg`, evenly spaced.
export function arcLayout(count, startAngleDeg, totalArcDeg) {
  if (count === 0) return [];
  const step = totalArcDeg / count;
  return Array.from({ length: count }, (_, i) => startAngleDeg + step * (i + 0.5));
}
