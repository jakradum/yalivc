import 'server-only';
import { SLIDE_W, SLIDE_H } from '../core/constants';
import { runOverflowCheck } from './checks';

export class ExportCheckError extends Error {
  constructor(problems) {
    super(`Deck export failed overflow check: ${problems.length} element(s) overflow their box`);
    this.problems = problems;
  }
}

// The ONLY file that imports Puppeteer, and only dynamically inside this
// function — enforced by convention here (Phase 1); an ESLint
// no-restricted-imports rule is Phase 2+ hardening.
//
// Chromium setup copied exactly from src/lib/pdfRequestHandler.js (the
// LP quarterly report's proven production pattern) rather than
// reinvented — same pinned CHROMIUM_URL, same local/Vercel branch.
export async function exportDeckPdf({ deckId, baseUrl, dataSource = 'fixture', allowOverflow = false, sessionCookie }) {
  let browser;
  try {
    if (process.env.VERCEL) {
      const chromium = (await import('@sparticuz/chromium-min')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      const CHROMIUM_URL =
        process.env.CHROMIUM_URL ||
        'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar';
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

    // The print page is behind the partners portal, so Chromium needs the
    // requesting user's session. Set it as a cookie scoped to baseUrl —
    // NOT a global Cookie header, which would also be sent to third
    // parties the page loads from (cdn.sanity.io images).
    if (!sessionCookie) throw new Error('exportDeckPdf: sessionCookie is required');
    await page.setCookie({ name: 'portal-session', value: sessionCookie, url: baseUrl });

    // On localhost the route is reached directly at /partners/...; on the
    // partners subdomain the proxy serves it at the clean /decks/... path.
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(baseUrl);
    const routePrefix = isLocal ? '/partners' : '';
    const url = `${baseUrl}${routePrefix}/decks/${deckId}/print${dataSource === 'sanity' ? '?data=sanity' : ''}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.waitForFunction(() => document.body.getAttribute('data-deck-ready') === '1', {
      timeout: 15000,
    });

    const problems = await page.evaluate(runOverflowCheck);
    if (problems.length && !allowOverflow) {
      throw new ExportCheckError(problems);
    }

    const pdfBuffer = await page.pdf({
      width: `${SLIDE_W}px`,
      height: `${SLIDE_H}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    const manifest = {
      deckId,
      generatedAt: new Date().toISOString(),
      dataSource,
      slideCount: await page.$$eval('.deck-slide', (els) => els.length),
      pageSize: { w: SLIDE_W, h: SLIDE_H },
      overflowProblems: problems,
    };

    return { pdfBuffer, manifest };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
