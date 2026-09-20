// Pixel-matched to the legacy Fund II deployment pie (.fi-pie): a 460×540
// SVG, centre (230,270), R 165, first slice starting at 12 o'clock and
// running clockwise, gold for the first slice and crimson for the second;
// slices of 15%+ carry their name inside in white; and a ruled legend with
// a bordered dot for the gold slice. Feeds from
// fund2Settings.deploymentStageAllocation (Sanity), not hardcoded
// percentages like the legacy slide.
const CX = 230;
const CY = 270;
const R = 165;
const COLORS = ['#ebde84', '#830d35', '#555555', '#999999'];

const pt = (deg, r = R) => {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
};

function arcPath(start, end) {
  const [x1, y1] = pt(start);
  const [x2, y2] = pt(end);
  return `M${CX},${CY} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${end - start > 180 ? 1 : 0},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
}

export function PieChart({ allocation = [] }) {
  const total = allocation.reduce((sum, a) => sum + (a.percent || 0), 0) || 1;
  let cursor = -90;
  const arcs = allocation.map((a, i) => {
    const sweep = ((a.percent || 0) / total) * 360;
    const arc = { ...a, start: cursor, end: cursor + sweep, color: COLORS[i % COLORS.length] };
    cursor += sweep;
    return arc;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <div style={{ width: 460, flexShrink: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
        <svg viewBox="0 0 460 540" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: 'var(--deck-font-mono)' }}>
          {arcs.map((a) => (
            <path key={a.stage} d={arcPath(a.start, a.end)} fill={a.color} />
          ))}
          {arcs
            .filter((a) => (a.percent / total) * 100 >= 15)
            .map((a) => {
              const [x, y] = pt((a.start + a.end) / 2, 95);
              const words = a.stage.split(' ');
              return words.map((w, i) => (
                <text key={`${a.stage}-${i}`} x={x.toFixed(0)} y={(y + 4 + (i - (words.length - 1) / 2) * 14).toFixed(0)} textAnchor="middle" fontSize={11} fontWeight={700} fill={a.color === '#ebde84' ? '#830d35' : '#fff'}>
                  {w}
                </text>
              ));
            })}
        </svg>
      </div>
      {/* Pixel-matched to .fi-pie-legend/.fi-legend-item — a bordered
          list with name/pct stacked flush right, not an inline row. */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 32 }}>
        {arcs.map((a, i) => (
          <div key={a.stage} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arcs.length - 1 ? '1px solid var(--deck-color-ink)' : 'none' }}>
            <div style={{ width: 10, height: 10, flexShrink: 0, background: a.color, border: a.color === '#ebde84' ? '1px solid var(--deck-color-ink)' : 'none', boxSizing: 'border-box' }} />
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-ink)', flex: 1 }}>{a.stage}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>{a.percent}%</span>
              {a.note ? <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, color: '#888' }}>{a.note}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
