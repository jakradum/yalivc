import 'server-only';
import { FORMATS } from './formats';
import { launchBrowser } from '@/decks/export/browser';

// Renders a validated creative asset to picture(s): one PNG per page, or one PDF
// with a page per slide (the LinkedIn carousel format). Chromium visits the studio's
// own print route (same React as the preview, same self-hosted fonts), so the download
// is exactly what was on screen. The session cookie is scoped to baseUrl only.
export async function exportAsset({ doc, pageIndex, as, baseUrl, sessionCookie }) {
  const format = FORMATS[doc.format];
  const pages = as === 'png' ? [pageIndex] : doc.pages.map((_, i) => i);
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: format.w, height: format.h, deviceScaleFactor: 1 });
    await page.setCookie({ name: 'team-session', value: sessionCookie, url: baseUrl });
    await page.evaluateOnNewDocument((job) => { window.__creativeDoc = job; }, { doc, pages });
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(baseUrl);
    await page.goto(`${baseUrl}${isLocal ? '/team' : ''}/builder/creative/print/`, { waitUntil: 'networkidle0', timeout: 25000 });
    await page.waitForFunction(() => document.body.getAttribute('data-creative-ready') === '1', { timeout: 15000 });
    if (as === 'png') {
      return { buffer: Buffer.from(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: format.w, height: format.h } })), type: 'image/png', ext: 'png' };
    }
    const buffer = await page.pdf({ width: `${format.w}px`, height: `${format.h}px`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
    return { buffer: Buffer.from(buffer), type: 'application/pdf', ext: 'pdf' };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
