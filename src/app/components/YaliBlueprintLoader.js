'use client';

// Loader in the homepage's blueprint style (see HomeMotion.js): on a dashed grid,
// the lion is printed line by line in grey, flashes crimson and holds, then the
// lines are erased in reverse and it prints again, for as long as it is shown.
// Timing: plotted and filled in ~1.6 s, so a typical 1 to 2 s load ends on a whole lion.
import { useEffect, useRef } from 'react';
import { LION_PATHS, LION_VIEWBOX } from './yali-loader-paths';

const CRIMSON = '#830d35';
const INK = '#363636';
const PLOT_MS = 1300;
const FILL_MS = 250;
const HOLD_MS = 550;
const ERASE_MS = 700;
const GAP_MS = 150;

const [VX, VY, VW, VH] = LION_VIEWBOX.split(' ').map(Number);
const PAD = 4;
const BOX = `${VX - PAD} ${VY - PAD} ${VW + PAD * 2} ${VH + PAD * 2}`;
const ease = (t) => 1 - Math.pow(1 - t, 3);

export default function YaliBlueprintLoader({ size = 120, label = 'Loading' }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const pathEls = [...svg.querySelectorAll('[data-shape]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      pathEls.forEach((p) => { p.style.fillOpacity = '1'; p.style.strokeOpacity = '0'; });
      return undefined;
    }
    // Plot order: top to bottom in bands, left to right within a band, like the homepage plotter.
    const shapes = pathEls.map((el) => {
      const len = el.getTotalLength();
      const b = el.getBBox();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      return { el, len, band: Math.round(b.y / 4), x: b.x };
    }).sort((a, b) => a.band - b.band || a.x - b.x);
    const total = shapes.reduce((s, p) => s + p.len, 0);
    // Print (or erase) up to a length along the whole lion, shape after shape
    const drawTo = (d) => {
      let left = d;
      for (const s of shapes) {
        const done = Math.max(0, Math.min(s.len, left));
        s.el.style.strokeDashoffset = `${s.len - done}`;
        left -= s.len;
      }
    };
    const setFill = (a) => shapes.forEach((s) => { s.el.style.fillOpacity = `${a}`; s.el.style.strokeOpacity = `${1 - a}`; });

    let raf;
    let t0 = performance.now();
    const cycle = PLOT_MS + FILL_MS + HOLD_MS + ERASE_MS + GAP_MS;
    const frame = (now) => {
      const t = (now - t0) % cycle;
      if (t < PLOT_MS) {
        setFill(0);
        drawTo(total * ease(t / PLOT_MS));
      } else if (t < PLOT_MS + FILL_MS) {
        drawTo(total);
        setFill((t - PLOT_MS) / FILL_MS);
      } else if (t < PLOT_MS + FILL_MS + HOLD_MS) {
        drawTo(total); setFill(1);
      } else if (t < PLOT_MS + FILL_MS + HOLD_MS + ERASE_MS) {
        const e = (t - PLOT_MS - FILL_MS - HOLD_MS) / ERASE_MS;
        setFill(Math.max(0, 1 - e * 3));
        drawTo(total * (1 - ease(e)));
      } else {
        drawTo(0); setFill(0);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const height = Math.round((size * (VH + PAD * 2)) / (VW + PAD * 2));
  return (
    <div role="img" aria-label={label} style={{ display: 'inline-flex' }}>
      <svg ref={svgRef} width={size} height={height} viewBox={BOX} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <pattern id="yali-blueprint-grid" width="3" height="3" patternUnits="userSpaceOnUse" x={VX - PAD} y={VY - PAD}>
            <path d="M3 0H0V3" fill="none" stroke={INK} strokeWidth="0.06" strokeDasharray="0.35 0.35" opacity="0.45" />
          </pattern>
        </defs>
        <rect x={VX - PAD} y={VY - PAD} width={VW + PAD * 2} height={VH + PAD * 2} fill="url(#yali-blueprint-grid)" />
        {LION_PATHS.map((p, i) => (
          <path key={i} data-shape d={p.d} fillRule={p.fillRule}
            style={{ fill: CRIMSON, fillOpacity: 0, stroke: INK, strokeWidth: 0.18, strokeLinejoin: 'round' }} />
        ))}
      </svg>
    </div>
  );
}
