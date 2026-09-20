// Port of legacy "SLIDE 10 — PORTFOLIO BY SECTOR (PIE)" (.fi-pie): a 460×540
// pie (centre 230,270, R 165, largest slice first, clockwise from 12
// o'clock) and a ruled legend. The legacy paths and percentages were
// hand-computed; here they're computed from the slices (amount invested per
// sector), so the pie tracks Sanity. Same palette and label rules: names
// sit inside slices of 15% or more, in white on dark slices.
const CX = 230;
const CY = 270;
const R = 165;
const SHORT = { 'Aerospace & Surveillance': ['Aerospace', '& Surv.'], 'Artificial Intelligence': ['AI'], 'Life Sciences': ['Life Sci'], 'Fabless Semiconductor': ['Fabless'] };
const DARK = new Set(['#830d35', '#bb3e68', '#d65d85']);

const pt = (deg, r = R) => {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
};

function Slice({ start, end, color }) {
  const [x1, y1] = pt(start);
  const [x2, y2] = pt(end);
  const large = end - start > 180 ? 1 : 0;
  return <path d={`M${CX},${CY} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`} fill={color} />;
}

export function SectorPieSlide({ heading, slices = [] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let cursor = -90;
  const arcs = slices.map((s) => {
    const sweep = (s.value / total) * 360;
    const arc = { ...s, start: cursor, end: cursor + sweep };
    cursor += sweep;
    return arc;
  });
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '28px 48px 28px 40px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 22, left: 40, fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>{heading}</div>
      <div style={{ width: 460, flexShrink: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
        <svg viewBox="0 0 460 540" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: 'var(--deck-font-mono)' }}>
          {arcs.map((a) => (
            <Slice key={a.label} {...a} />
          ))}
          {arcs
            .filter((a) => parseFloat(a.percent) >= 15)
            .map((a) => {
              const [x, y] = pt((a.start + a.end) / 2, 95);
              const lines = SHORT[a.label] || [a.label];
              return lines.map((t, i) => (
                <text key={`${a.label}-${i}`} x={x.toFixed(0)} y={(y + 4 + (i - (lines.length - 1) / 2) * 13).toFixed(0)} textAnchor="middle" fontSize={10} fontWeight={700} fill={DARK.has(a.color) ? '#fff' : '#830d35'}>
                  {t}
                </text>
              ));
            })}
        </svg>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 32 }}>
        {arcs.map((a, i) => (
          <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arcs.length - 1 ? '1px solid var(--deck-color-ink)' : 'none' }}>
            <div style={{ width: 10, height: 10, flexShrink: 0, background: a.color, border: a.color === '#fae3ec' ? '1px solid var(--deck-color-ink)' : 'none', boxSizing: 'border-box' }} />
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-ink)', flex: 1 }}>{a.label}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--deck-color-crimson)' }}>₹{a.amount} Cr</span>
              <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, color: '#888' }}>{a.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
