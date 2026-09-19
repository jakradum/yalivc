import { polar, arcLayout } from './geometry';
import { DIAGRAM } from './diagram.config';
import { SECTOR_ICONS } from './icons';

function SectorIcon({ label, x, y, color }) {
  const inner = SECTOR_ICONS[label];
  if (!inner) return null;
  return (
    <svg
      x={x - 11}
      y={y - 11}
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

// Data-driven, config-driven port of the legacy .s4-diagram. Props:
// { core: [{label}], adjacent: [{label}] } — sector NAMES come from
// Sanity (fund2Settings.focusSectors / adjacentSectors) via the caller;
// this component only knows how to lay them out.
export function HubAndSpoke({ core = [], adjacent = [] }) {
  const { center: c, outerRadius, hubRadius, coreArc, adjacentArc, colors } = DIAGRAM;

  const coreAngles = arcLayout(core.length, coreArc.startAngle, coreArc.totalDeg);
  const adjacentAngles = arcLayout(adjacent.length, adjacentArc.startAngle, adjacentArc.totalDeg);

  const boundaryAngles = [coreArc.startAngle, coreArc.startAngle + coreArc.totalDeg];

  return (
    <svg
      viewBox={`0 0 ${DIAGRAM.viewBox.w} ${DIAGRAM.viewBox.h}`}
      width="100%"
      height="100%"
      style={{ fontFamily: 'var(--deck-font-mono)' }}
    >
      <circle cx={c.x} cy={c.y} r={outerRadius} fill="none" stroke={colors.border} strokeWidth={1} />

      {coreAngles.map((angle, i) => {
        const p = polar(c.x, c.y, outerRadius, angle);
        return (
          <line key={`core-spoke-${i}`} x1={c.x} y1={c.y} x2={p.x} y2={p.y} stroke={colors.connector} strokeWidth={0.6} strokeDasharray="2,3" />
        );
      })}
      {adjacentAngles.map((angle, i) => {
        const p = polar(c.x, c.y, outerRadius, angle);
        return (
          <line key={`adj-spoke-${i}`} x1={c.x} y1={c.y} x2={p.x} y2={p.y} stroke={colors.connector} strokeWidth={0.6} strokeDasharray="2,3" />
        );
      })}

      {boundaryAngles.map((angle, i) => {
        const p = polar(c.x, c.y, outerRadius, angle);
        return <line key={`boundary-${i}`} x1={c.x} y1={c.y} x2={p.x} y2={p.y} stroke={colors.boundary} strokeWidth={1.5} />;
      })}

      <circle cx={c.x} cy={c.y} r={hubRadius} fill={colors.core} />
      <image href="/favicon.svg" x={c.x - 26} y={c.y - 26} width={52} height={52} style={{ filter: 'brightness(0) invert(1)' }} />

      {core.map((sector, i) => {
        const iconP = polar(c.x, c.y, coreArc.iconRadius, coreAngles[i]);
        const labelP = polar(c.x, c.y, coreArc.labelRadius, coreAngles[i]);
        return (
          <g key={sector.label}>
            <SectorIcon label={sector.label} x={iconP.x} y={iconP.y} color={colors.border} />
            <text x={labelP.x} y={labelP.y} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.core}>
              {sector.label}
            </text>
          </g>
        );
      })}
      {adjacent.map((sector, i) => {
        const iconP = polar(c.x, c.y, adjacentArc.iconRadius, adjacentAngles[i]);
        const labelP = polar(c.x, c.y, adjacentArc.labelRadius, adjacentAngles[i]);
        return (
          <g key={sector.label}>
            <SectorIcon label={sector.label} x={iconP.x} y={iconP.y} color={colors.adjacent} />
            <text x={labelP.x} y={labelP.y} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={colors.adjacent}>
              {sector.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
