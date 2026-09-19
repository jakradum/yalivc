'use client';

import { useEffect } from 'react';

// Mirrors the LP quarterly report's `data-pdf-ready` pattern
// (src/lib/pdfRequestHandler.js) so the same kind of Puppeteer
// waitForFunction gate can be used for the deck's PDF export.
export function ReadySignal() {
  useEffect(() => {
    let cancelled = false;

    async function waitAndSignal() {
      try {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
        const images = Array.from(document.images);
        await Promise.all(
          images.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.addEventListener('load', resolve, { once: true });
                  img.addEventListener('error', resolve, { once: true });
                })
          )
        );
      } finally {
        if (!cancelled) {
          document.body.setAttribute('data-deck-ready', '1');
        }
      }
    }

    waitAndSignal();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
