import 'server-only';
import { SLIDE_W, SLIDE_H } from '../core/constants';

// The ONLY file that imports Puppeteer, and only dynamically inside this
// function — enforced by convention here (Phase 1); an ESLint
// no-restricted-imports rule is Phase 2+ hardening.
//
// Chromium setup copied exactly from src/lib/pdfRequestHandler.js (the
// LP quarterly report's proven production pattern) rather than
// reinvented — same pinned CHROMIUM_URL, same local/Vercel branch.
export async function exportDeckPdf({ deckId, baseUrl, dataSource = 'fixture' }) {
  let browser;
  try {
    if (process.env.VERCEL) {
      const chromium = (await import('@sparticuz/chromium-min')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      const CHROMIUM_URL =
        process.env.CHROMIUM_URL ||
        'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar';
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(CHROMIUM_URL),
        headless: true,
      });
    } else {
      const puppeteer = (await import('puppeteer')).default;
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 1 });

    const url = `${baseUrl}/team/decks/${deckId}/print${dataSource === 'sanity' ? '?data=sanity' : ''}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.waitForFunction(() => document.body.getAttribute('data-deck-ready') === '1', {
      timeout: 15000,
    });

    const pdfBuffer = await page.pdf({
      width: `${SLIDE_W}px`,
      height: `${SLIDE_H}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    return pdfBuffer;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
