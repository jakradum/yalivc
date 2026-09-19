'use client';

import { useEffect, useRef, useState } from 'react';
import { SLIDE_W, SLIDE_H } from '../core/constants';
import { ReadySignal } from './ReadySignal';
import '../design-system/fonts.css';
import '../design-system/tokens.css';

// Phase 1: single-slide fit-to-viewport preview. Scroll/grid modes are
// Phase 2+ (PreviewShell in the blueprint) — kept minimal here to prove
// the pipeline first.
export function PreviewShell({ deckId, dataSource, children }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function fit() {
      const el = wrapRef.current;
      if (!el) return;
      const pad = 32;
      const availW = window.innerWidth - pad * 2;
      const availH = window.innerHeight - pad * 2 - 40; // toolbar space
      setScale(Math.min(availW / SLIDE_W, availH / SLIDE_H, 1));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div className="deck-root" style={{ background: '#d8d5cc', minHeight: '100vh' }}>
      <ReadySignal />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          fontFamily: 'var(--deck-font-mono)',
          fontSize: 11,
          color: '#555',
          background: '#eceae2',
          borderBottom: '1px solid #ccc',
        }}
      >
        <span>deck: {deckId} · source: {dataSource}</span>
        <span>preview — not the print output</span>
      </div>
      <div
        ref={wrapRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div
          style={{
            width: SLIDE_W * scale,
            height: SLIDE_H * scale,
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
