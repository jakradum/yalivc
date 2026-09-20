// Faithful port of the legacy separator-slide pattern bank (.s3-div-grid /
// .fi-div-grid, "Separator slides — explicit JS-rendered SVG patterns").
// Seven patterns, 400×540, gold on crimson. Legacy shuffled them at
// runtime so each divider got a unique one; here the choice is explicit
// (`pattern` 1–7, set per divider in the manifest) so renders are stable.
// Note p2 mirrors legacy exactly: its lines are appended outside the
// opacity group, so it renders at full stroke opacity.
const W = 400;
const H = 540;
const GOLD = '#ebde84';

const range = (start, end, step) => {
  const out = [];
  for (let v = start; v < end; v += step) out.push(v);
  return out;
};

function P1({ c = GOLD }) {
  const step = 26;
  return (
    <g opacity={0.55}>
      {range(13, H, step).flatMap((y) =>
        range(13, W, step).map((x) => (
          <g key={`${x}-${y}`} stroke={c} strokeWidth={1.4}>
            <line x1={x} y1={y - 6} x2={x} y2={y + 6} />
            <line x1={x - 6} y1={y} x2={x + 6} y2={y} />
          </g>
        ))
      )}
    </g>
  );
}

function P2({ c = GOLD }) {
  const ww = 60;
  const amp = 11;
  const rowH = 28;
  return (
    <g>
      {range(rowH, H + rowH, rowH).map((y) => {
        let d = `M -${ww},${y}`;
        for (let x = -ww; x < W + ww; x += ww) {
          d += ` C ${x + ww / 4},${y - amp} ${x + (ww * 3) / 4},${y + amp} ${x + ww},${y}`;
        }
        return <path key={y} d={d} fill="none" stroke={c} strokeWidth={0.9} />;
      })}
    </g>
  );
}

function P3({ c = GOLD }) {
  return (
    <g opacity={0.5} stroke={c} strokeWidth={0.9}>
      {range(-H, W + H, 26).map((k) => (
        <line key={k} x1={k} y1={0} x2={k + H} y2={H} />
      ))}
    </g>
  );
}

function P4({ c = GOLD }) {
  const step = 22;
  const dots = [];
  range(step / 2, H, step).forEach((y, row) => {
    const off = (row % 2) * (step / 2);
    range(step / 2 + off, W, step).forEach((x) => dots.push({ x, y }));
  });
  return (
    <g opacity={0.65} fill={c}>
      {dots.map((p) => (
        <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={2.2} />
      ))}
    </g>
  );
}

function P5({ c = GOLD }) {
  const step = 28;
  const arm = 5;
  return (
    <g opacity={0.55} stroke={c} strokeWidth={1.3}>
      {range(14, H, step).flatMap((y) =>
        range(14, W, step).map((x) => (
          <g key={`${x}-${y}`}>
            <line x1={x - arm} y1={y - arm} x2={x + arm} y2={y + arm} />
            <line x1={x + arm} y1={y - arm} x2={x - arm} y2={y + arm} />
          </g>
        ))
      )}
    </g>
  );
}

function P6({ c = GOLD }) {
  return (
    <g opacity={0.45} stroke={c} strokeWidth={0.8}>
      {range(-H, W + H, 32).map((k) => (
        <g key={k}>
          <line x1={k} y1={0} x2={k + H} y2={H} />
          <line x1={k + H} y1={0} x2={k} y2={H} />
        </g>
      ))}
    </g>
  );
}

function P7({ c = GOLD }) {
  const rowH = 18;
  const dw = 14;
  const gap = 8;
  const dashes = [];
  range(rowH, H, rowH).forEach((y, row) => {
    const off = (row % 2) * ((dw + gap) / 2);
    range(off, W + dw, dw + gap).forEach((x) => dashes.push({ x, y }));
  });
  return (
    <g opacity={0.55} stroke={c} strokeWidth={1.2}>
      {dashes.map((p) => (
        <line key={`${p.x}-${p.y}`} x1={p.x} y1={p.y} x2={p.x + dw} y2={p.y} />
      ))}
    </g>
  );
}

const PATTERNS = { 1: P1, 2: P2, 3: P3, 4: P4, 5: P5, 6: P6, 7: P7 };

// `color` recolours the pattern (default: brand gold). `fill` makes the svg
// stretch to its container (cropping, not distorting) — used by the creative
// builder's pattern block; the deck dividers keep the fixed 400×540 size.
export function SeparatorPattern({ pattern = 1, color = GOLD, fill = false }) {
  const Pattern = PATTERNS[pattern];
  if (!Pattern) return null;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={fill ? '100%' : W}
      height={fill ? '100%' : H}
      preserveAspectRatio={fill ? 'xMidYMid slice' : undefined}
      style={{ display: 'block' }}
    >
      <Pattern c={color} />
    </svg>
  );
}
