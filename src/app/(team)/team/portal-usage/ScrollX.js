'use client';

import { useEffect, useRef, useState } from 'react';
import s from './dashboard.module.css';

// A sideways-scrolling table box that says so: when the table is wider than the
// box, a fade sits on the edge with more columns and a line under the table reads
// "Scroll sideways for more columns". Both go once the reader reaches the end.
export function ScrollX({ children }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const check = () => setEdge({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
  }, []);

  return (
    <div className={s.scrollWrap}>
      <div ref={ref} className={s.scroll}>{children}</div>
      {edge.left ? <span className={s.fadeLeft} aria-hidden="true" /> : null}
      {edge.right ? <span className={s.fadeRight} aria-hidden="true" /> : null}
      {edge.right || edge.left ? <p className={s.scrollHint}>{edge.right ? 'Scroll sideways for more columns' : 'Scroll back for the first columns'}</p> : null}
    </div>
  );
}
