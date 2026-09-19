// Every tunable number, in one place. A redesign round (this diagram has
// had 5+ so far) should mean editing this file plus CSS, not rewriting
// the component. Values below match the legacy fund2-deck-v2.0.html
// hub-and-spoke SVG (viewBox 0 0 880 490, hub at 440,245).
export const DIAGRAM = {
  viewBox: { w: 880, h: 490 },
  center: { x: 440, y: 245 },
  outerRadius: 235,
  hubRadius: 42,
  coreArc: { startAngle: -105, totalDeg: 210, labelRadius: 265, iconRadius: 220 },
  adjacentArc: { startAngle: 105, totalDeg: 150, labelRadius: 265, iconRadius: 220 },
  colors: {
    core: '#830d35',
    adjacent: '#9c7a1e',
    connector: '#c0bcb8',
    boundary: '#830d35',
    border: '#363636',
  },
};
