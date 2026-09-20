import { LAYOUT } from './layout';
import { SECTOR_ICONS } from './icons';

// Sanity's category name ("Aerospace and Surveillance") doesn't
// byte-match the legacy display label ("Aerospace & Surveillance"),
// which silently dropped that sector entirely (LAYOUT lookup miss ->
// null render, found by comparing the actual output against legacy).
// Normalize both sides before lookup rather than assuming exact match.
function normalizeLabel(label) {
  return label.replace(/\s*&\s*/g, ' and ').replace(/\s+/g, ' ').trim().toLowerCase();
}
function lookupEntry(table, label) {
  if (table[label]) return table[label];
  const target = normalizeLabel(label);
  const key = Object.keys(table).find((k) => normalizeLabel(k) === target);
  return key ? table[key] : undefined;
}

function SectorIcon({ label, pos, color }) {
  const inner = lookupEntry(SECTOR_ICONS, label);
  if (!inner) return null;
  return (
    <svg
      x={pos.x}
      y={pos.y}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

// The legacy spokes run to the icon's centre, straight through the label
// text beneath it. Same coordinates, but each line now stops PAD px short of
// the icon/label cluster: the ray from the hub is clipped at the first
// bounding box (icon, or a label line) it enters.
const PAD = 4;
const CHAR_W = 0.6; // JetBrains Mono advance, in em

function clusterBoxes(entry, fontSize) {
  const boxes = [{ x0: entry.icon.x, y0: entry.icon.y, x1: entry.icon.x + 22, y1: entry.icon.y + 22 }];
  for (const l of entry.labels) {
    const w = l.text.length * fontSize * CHAR_W;
    boxes.push({ x0: l.x - w / 2, y0: l.y - fontSize * 0.85, x1: l.x + w / 2, y1: l.y + fontSize * 0.25 });
  }
  return boxes.map((b) => ({ x0: b.x0 - PAD, y0: b.y0 - PAD, x1: b.x1 + PAD, y1: b.y1 + PAD }));
}

function spokeEnd(entry, fontSize) {
  const { cx, cy } = LAYOUT.hub;
  const dx = entry.spoke.x - cx;
  const dy = entry.spoke.y - cy;
  let tEnd = 1;
  for (const b of clusterBoxes(entry, fontSize)) {
    // slab method: entry parameter of the ray into the box
    let t0 = 0;
    let t1 = 1;
    for (const [d, o, lo, hi] of [[dx, cx, b.x0, b.x1], [dy, cy, b.y0, b.y1]]) {
      if (d === 0) {
        if (o < lo || o > hi) t1 = -1;
      } else {
        const a = (lo - o) / d;
        const c = (hi - o) / d;
        t0 = Math.max(t0, Math.min(a, c));
        t1 = Math.min(t1, Math.max(a, c));
      }
    }
    if (t0 <= t1) tEnd = Math.min(tEnd, t0);
  }
  return { x: cx + dx * tEnd, y: cy + dy * tEnd };
}

function SectorGroup({ label, entry, color, fontSize }) {
  if (!entry) return null;
  const end = spokeEnd(entry, fontSize);
  return (
    <g>
      <line x1={LAYOUT.hub.cx} y1={LAYOUT.hub.cy} x2={end.x} y2={end.y} stroke="#c0bcb8" strokeWidth={0.6} strokeDasharray="2,3" />
      <SectorIcon label={label} pos={entry.icon} color="#363636" />
      {entry.labels.map((l) => (
        <text key={l.text} x={l.x} y={l.y} textAnchor="middle" fontSize={fontSize} fontWeight={700} fill={color}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

// Direct port of the legacy hub-and-spoke SVG — literal coordinates from
// layout.js, not recomputed trigonometry, per direct request after the
// computed-geometry version came out visibly off.
export function HubAndSpoke({ core = [], adjacent = [] }) {
  const { viewBox, hub, outerRadius, boundaryLines } = LAYOUT;
  return (
    <svg viewBox={`0 0 ${viewBox.w} ${viewBox.h}`} width="100%" height="100%" style={{ fontFamily: 'var(--deck-font-mono)' }}>
      <circle cx={hub.cx} cy={hub.cy} r={outerRadius} fill="none" stroke="#363636" strokeWidth={1} />

      {core.map((s) => (
        <SectorGroup key={s.label} label={s.label} entry={lookupEntry(LAYOUT.core, s.label)} color="#830d35" fontSize={10} />
      ))}
      {adjacent.map((s) => (
        <SectorGroup key={s.label} label={s.label} entry={lookupEntry(LAYOUT.adjacent, s.label)} color="#9c7a1e" fontSize={9.5} />
      ))}

      {boundaryLines.map((b, i) => (
        <line key={i} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke="#830d35" strokeWidth={1.5} />
      ))}

      <circle cx={hub.cx} cy={hub.cy} r={hub.r} fill="#830d35" />
      <image href="/favicon.svg" x={hub.cx - 26} y={hub.cy - 26} width={52} height={52} style={{ filter: 'brightness(0) invert(1)' }} />
    </svg>
  );
}
