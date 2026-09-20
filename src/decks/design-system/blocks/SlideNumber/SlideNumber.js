'use client';

import { useEffect, useRef, useState } from 'react';
import { SLIDE_W } from '@/decks/core/constants';

// Port of the legacy slide numbering (fund2-deck-v2.0.html, "Slide
// numbering — viewfinder bracket style" + .slide-num CSS): a mono number
// held between two corner brackets, bottom-right.
//   - the caller decides which slides get one (cover / dividers don't — see
//     core/slideNumbers.js) and whether it's on a dark ground;
//   - on light slides, if a table or any bordered element reaches the
//     bottom-right corner, the number is dropped rather than hide data —
//     legacy `hasContentNearBottomRight`, same 70×36px region, measured
//     in slide space so it holds under the preview's CSS scaling.
const VF = 'M24 4C24 1.79086 25.7909 0 28 0V24V28H24H0C0 25.7909 1.79086 24 4 24L24 24V4Z';

function Bracket({ rotate, fill, style }) {
  return (
    <svg width="14" height="14" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...style, transform: rotate ? 'rotate(180deg)' : undefined }}>
      <path fillRule="evenodd" clipRule="evenodd" d={VF} fill={fill} />
    </svg>
  );
}

function cornerHasContent(numberEl) {
  const slide = numberEl.closest('.deck-slide');
  if (!slide) return false;
  const sr = slide.getBoundingClientRect();
  const k = sr.width / SLIDE_W; // preview scale
  const left = sr.right - 70 * k;
  const top = sr.bottom - 36 * k;
  for (const el of slide.querySelectorAll('*')) {
    if (numberEl.contains(el)) continue;
    const er = el.getBoundingClientRect();
    if (er.width === 0 || er.height === 0) continue;
    if (er.right < left || er.left > sr.right || er.bottom < top || er.top > sr.bottom) continue;
    if (['TABLE', 'TR', 'TD', 'TH'].includes(el.tagName)) return true;
    const cs = getComputedStyle(el);
    if (['Top', 'Bottom', 'Left', 'Right'].some((side) => parseFloat(cs[`border${side}Width`]) > 0)) return true;
  }
  return false;
}

export function SlideNumber({ number, dark = false, hidden = false, autoHide = false }) {
  const ref = useRef(null);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    if (!autoHide || dark || !ref.current) return undefined;
    let live = true;
    const check = () => live && ref.current && setCovered(cornerHasContent(ref.current));
    check();
    // Fonts and logos change layout after first paint; re-measure once settled.
    document.fonts?.ready.then(check);
    window.addEventListener('load', check);
    return () => {
      live = false;
      window.removeEventListener('load', check);
    };
  }, [autoHide, dark, number]);

  if (hidden || covered) return null;
  const color = dark ? '#efefef' : '#363636';
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        right: 16,
        bottom: 12,
        height: 24,
        display: 'flex',
        alignItems: 'stretch',
        gap: 5,
        fontFamily: 'var(--deck-font-mono)',
        fontSize: 9,
        color,
        lineHeight: 1,
        pointerEvents: 'none',
      }}
    >
      <Bracket rotate fill={color} style={{ alignSelf: 'flex-start' }} />
      <span style={{ alignSelf: 'center', letterSpacing: '0.08em' }}>{number}</span>
      <Bracket fill={color} style={{ alignSelf: 'flex-end' }} />
    </div>
  );
}
