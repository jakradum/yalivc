// Ports .fi-pie-chart/.fi-pie-legend — feeds directly from
// fund2Settings.deploymentStageAllocation (Sanity), not hardcoded
// percentages like the legacy slide has.
function toArcPath(cx, cy, r, startDeg, endDeg) {
  const toXY = (deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = toXY(startDeg);
  const [x2, y2] = toXY(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
}

const COLORS = ['var(--deck-color-crimson)', 'var(--deck-color-gold)', '#555', '#999'];

export function PieChart({ allocation = [] }) {
  let cursor = 0;
  const total = allocation.reduce((sum, a) => sum + (a.percent || 0), 0) || 1;
  const arcs = allocation.map((a, i) => {
    const start = cursor;
    const sweep = ((a.percent || 0) / total) * 360;
    cursor += sweep;
    return { ...a, start, end: cursor, color: COLORS[i % COLORS.length] };
  });

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <svg viewBox="0 0 200 200" width={140} height={140}>
        {arcs.map((a) => (
          <path key={a.stage} d={toArcPath(100, 100, 90, a.start, a.end)} fill={a.color} />
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {arcs.map((a) => (
          <div key={a.stage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: a.color, border: 'var(--deck-border)' }} />
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 12, fontWeight: 700 }}>{a.stage}</span>
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 12 }}>{a.percent}%</span>
            {a.note ? <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 10, color: '#777' }}>{a.note}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
