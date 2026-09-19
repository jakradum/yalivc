import { SLIDE_W, SLIDE_H } from '../core/constants';
import { ReadySignal } from './ReadySignal';
import '../design-system/fonts.css';
import '../design-system/tokens.css';

// No toolbar, no scaling, natural size — this is exactly what Puppeteer
// captures. @page can't use var(), so inject literal px from constants.
export function PrintShell({ children }) {
  return (
    <div className="deck-root">
      <style>{`
        @page { size: ${SLIDE_W}px ${SLIDE_H}px; margin: 0; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; }
        .deck-slide { break-inside: avoid; }
      `}</style>
      <ReadySignal />
      {children}
    </div>
  );
}
