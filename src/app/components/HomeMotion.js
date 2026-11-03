'use client';

// Homepage motion, desktop only (styles in landing-page-styles/home-motion.css).
// Adds no new visuals: it animates elements that are already there (the headline and
// its crimson caret, the lion outline, sector strip, viewfinder brackets, stat strip,
// portfolio grid). Mobile and reduced-motion visitors get the page exactly as before.
// Hooks are data-* attributes set in src/app/page.js.
import { useEffect } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>[]=+*#';
// Must match the media query in home-motion.css.
const DESKTOP = '(min-width: 901px) and (prefers-reduced-motion: no-preference)';

function onceInView(el, cb, threshold = 0.2) {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); cb(); } }, { threshold, rootMargin: '0px 0px -8% 0px' });
  io.observe(el);
  return () => io.disconnect();
}

// Hero headline types itself out; the existing blinking caret (h1::after) rides along.
function typewrite(h1) {
  const text = h1.textContent;
  h1.setAttribute('aria-label', text);
  h1.style.minHeight = `${h1.offsetHeight}px`;
  h1.textContent = '';
  h1.dataset.ready = '';
  let i = 0;
  const step = () => {
    i += 1;
    h1.textContent = text.slice(0, i);
    if (i < text.length) setTimeout(step, text[i - 1] === '.' ? 320 : 34);
  };
  setTimeout(step, 450);
}

// Section headings (JetBrains Mono) resolve from random glyphs, terminal style.
function decode(el, duration = 750) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const settled = Math.floor(p * text.length);
    el.textContent = text.split('').map((ch, i) =>
      ch === ' ' || i < settled ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
    if (p < 1) requestAnimationFrame(tick); else el.textContent = text;
  };
  requestAnimationFrame(tick);
}

function countUp(el, duration = 1300) {
  const to = parseInt(el.textContent, 10);
  if (!Number.isFinite(to)) return;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  el.textContent = '0';
  requestAnimationFrame(tick);
}

// ── Hero blueprint: the lion is plotted like an engineering drawing ─────────────
// The dashed grid is already on the sheet; a crimson gantry (crosshair + pen head +
// X/Y readout) draws the lion one stroke at a time, lifting and travelling in straight
// lines between strokes; then it retracts and the existing crimson hover fill
// flashes once.
const NS = 'http://www.w3.org/2000/svg';
const CRIMSON = '#830d35';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lerp = (a, b, t) => a + (b - a) * t;

function animate(dur, fn) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      fn(t);
      if (t < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
}

async function plotLion(wrap, onDrawn) {
  const svg = wrap.querySelector('svg');
  if (!svg) return;
  const [, , vw, vh] = (svg.getAttribute('viewBox') || '0 0 515 658').split(/\s+/).map(Number);
  const paths = [...svg.querySelectorAll('path')].map((p) => {
    const len = p.getTotalLength();
    const b = p.getBBox();
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    return { el: p, len, band: Math.round(b.y / 70), x: b.x };
  });
  // Draw top to bottom in bands, left to right within a band, like a plotter would.
  paths.sort((a, b) => a.band - b.band || a.x - b.x);
  wrap.dataset.ready = '';

  // Gantry: crosshair across the drawing frame, a pen head, and a coordinate readout.
  svg.style.overflow = 'visible';
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('pointer-events', 'none');
  const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); g.appendChild(e); return e; };
  const hLine = mk('line', { x1: -24, x2: vw + 24, stroke: CRIMSON, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', opacity: 0.5 });
  const vLine = mk('line', { y1: -24, y2: vh + 24, stroke: CRIMSON, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', opacity: 0.5 });
  const head = mk('rect', { width: 9, height: 9, fill: CRIMSON, stroke: CRIMSON, 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' });
  const readout = mk('text', { fill: CRIMSON, 'font-size': 15, 'font-family': 'var(--font-jetbrains-mono), monospace', 'letter-spacing': '0.06em' });
  svg.appendChild(g);
  const pen = { x: vw / 2, y: -24 };
  const place = (x, y, down) => {
    pen.x = x; pen.y = y;
    hLine.setAttribute('y1', y); hLine.setAttribute('y2', y);
    vLine.setAttribute('x1', x); vLine.setAttribute('x2', x);
    head.setAttribute('x', x - 4.5); head.setAttribute('y', y - 4.5);
    head.setAttribute('fill', down ? CRIMSON : 'none');
    readout.setAttribute('x', x + 12); readout.setAttribute('y', y - 12);
    readout.textContent = `X ${x.toFixed(1).padStart(5, '0')}  Y ${y.toFixed(1).padStart(5, '0')}`;
  };
  place(pen.x, pen.y, false);

  const total = paths.reduce((s, p) => s + p.len, 0);
  const speed = total / 5200; // whole lion in ~5s of pen-down time
  for (const p of paths) {
    const start = p.el.getPointAtLength(0);
    const from = { ...pen };
    const travel = Math.min(260, 60 + Math.hypot(start.x - from.x, start.y - from.y) * 0.5);
    await animate(travel, (t) => place(lerp(from.x, start.x, t), lerp(from.y, start.y, t), false)); // pen up
    await sleep(40);                                                                                 // pen down
    const dur = Math.max(70, p.len / speed);
    await animate(dur, (t) => {
      const d = p.len * t;
      p.el.style.strokeDashoffset = `${p.len - d}`;
      const pt = p.el.getPointAtLength(d);
      place(pt.x, pt.y, true);
    });
  }
  // Retract the gantry, flash the existing crimson fill once, then hand back to hover.
  const from = { ...pen };
  await animate(400, (t) => place(lerp(from.x, vw + 24, t), lerp(from.y, -24, t), false));
  g.remove();
  svg.style.overflow = '';
  paths.forEach((p) => { p.el.style.strokeDasharray = ''; p.el.style.strokeDashoffset = ''; });
  onDrawn?.();
  wrap.dataset.flash = 'on';
  await sleep(900);
  delete wrap.dataset.flash;
}

async function drawBlueprint() {
  const lion = document.querySelector('[data-lion]');
  if (!lion) return;
  const stage = lion.parentElement; // .graphicWrapper, which owns the hover fill
  stage?.setAttribute('data-drawing', '');
  await sleep(350);
  await plotLion(lion, () => stage?.removeAttribute('data-drawing'));
  stage?.removeAttribute('data-drawing');
}

export default function HomeMotion() {
  useEffect(() => {
    // Desktop only, and never under reduced motion: mobile and reduced-motion visitors
    // get the homepage exactly as it is today.
    if (!window.matchMedia(DESKTOP).matches) return;
    document.documentElement.dataset.motion = 'on';
    const cleanups = [];

    // Hero
    const h1 = document.querySelector('[data-typewrite]');
    if (h1) {
      typewrite(h1);
      const hero = h1.closest('section');
      hero?.querySelector('p')?.setAttribute('data-rise', '');
      hero?.querySelector('a[aria-label="For Founders"]')?.setAttribute('data-rise', 'late');
      requestAnimationFrame(() => hero?.setAttribute('data-in', ''));
    }
    drawBlueprint();

    // Section headings: viewfinder brackets lock onto the title, then it decodes.
    document.querySelectorAll('main header').forEach((hdr) => {
      const svgs = hdr.querySelectorAll(':scope > svg');
      const title = hdr.querySelector(':scope > h1');
      if (svgs.length !== 2 || !title || title.hasAttribute('data-typewrite')) return;
      hdr.setAttribute('data-vf', '');
      cleanups.push(onceInView(hdr, () => { hdr.setAttribute('data-in', ''); setTimeout(() => decode(title), 250); }, 0.5));
    });

    // Mission stat strip: numbers count up when it appears.
    document.querySelectorAll('[class*="statValue"]').forEach((el) => {
      if (!/^\d+$/.test(el.textContent.trim())) return;
      cleanups.push(onceInView(el, () => countUp(el), 0.6));
    });

    // Portfolio grid: cells arrive in sequence; hover shows viewfinder corners.
    document.querySelectorAll('[class*="companyGrid"], [class*="featuredRow"]').forEach((grid) => {
      const cells = grid.matches('[class*="featuredRow"]') ? [grid] : [...grid.children];
      cells.forEach((c, i) => { c.setAttribute('data-cell', ''); c.style.setProperty('--i', i); });
      cleanups.push(onceInView(grid, () => cells.forEach((c) => c.setAttribute('data-in', '')), 0.15));
    });

    // Everything else in a section rises gently as it scrolls in.
    document.querySelectorAll('main > section').forEach((sec, i) => {
      if (i === 0) return;
      sec.setAttribute('data-section', '');
      cleanups.push(onceInView(sec, () => sec.setAttribute('data-in', ''), 0.08));
    });

    return () => { cleanups.forEach((f) => f()); delete document.documentElement.dataset.motion; };
  }, []);
  return null;
}
