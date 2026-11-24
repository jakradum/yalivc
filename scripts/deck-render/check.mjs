// Checks a rendered deck (overflow per slide, the SlideNumber corner rule), screenshots slides, prints the PDF.
// usage (from the repo root): node scripts/deck-render/check.mjs <html> <shotPrefix|""> [pdfOut]
// Uses the system Chrome when puppeteer has no bundled browser (install with PUPPETEER_SKIP_DOWNLOAD=1).
import { createRequire } from 'module';
import fs from 'fs';
const req = createRequire(process.cwd() + '/package.json');
const puppeteer = req('puppeteer');
const [file, prefix, pdfOut] = process.argv.slice(2);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b = await puppeteer.launch({ headless: true, ...(fs.existsSync(CHROME) ? { executablePath: CHROME } : {}) }); const p = await b.newPage(); await p.setViewport({ width: 960, height: 540 });
await p.goto('file://' + file, { waitUntil: 'networkidle0', timeout: 90000 }); await p.evaluate(() => document.fonts.ready);
// Static markup never runs SlideNumber's effect, so apply its rule here:
// drop the number when a table or bordered element reaches the 70×36
// bottom-right corner (same test as cornerHasContent; dark numbers exempt).
const dropped = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('[data-slide-number]').forEach((n) => {
    if (n.style.color === 'rgb(239, 239, 239)') return;
    const s = n.closest('.deck-slide'); const sr = s.getBoundingClientRect();
    const left = sr.right - 70, top = sr.bottom - 36;
    const hit = [...s.querySelectorAll('*')].some((el) => {
      if (n.contains(el)) return false;
      const er = el.getBoundingClientRect();
      if (!er.width || !er.height || er.right < left || er.left > sr.right || er.bottom < top || er.top > sr.bottom) return false;
      if (['TABLE', 'TR', 'TD', 'TH'].includes(el.tagName)) return true;
      const cs = getComputedStyle(el);
      return ['Top', 'Bottom', 'Left', 'Right'].some((side) => parseFloat(cs[`border${side}Width`]) > 0);
    });
    if (hit) { out.push(n.textContent.trim()); n.remove(); }
  });
  return out;
});
console.log('numbers dropped (content in corner):', dropped.join(', ') || 'none');
const res = await p.evaluate(() => [...document.querySelectorAll('.deck-slide')].map((s, i) => {
  const sr = s.getBoundingClientRect(); let over = 0, bottom = 0;
  s.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (getComputedStyle(el).position === 'absolute' && /CONFIDENTIAL/.test(el.textContent)) return;
    bottom = Math.max(bottom, r.bottom - sr.top);
    if (r.bottom > sr.bottom + 0.5 || r.right > sr.right + 0.5) over = Math.max(over, Math.round(Math.max(r.bottom - sr.bottom, r.right - sr.right))); });
  return { i: i + 1, id: s.dataset.slideId, over, bottom: Math.round(bottom) };
}));
console.log(res.map((r) => `${r.i} ${r.id} over=${r.over} bottom=${r.bottom}`).join('\n'));
if (prefix) { const sl = await p.$$('.deck-slide'); for (let i = 0; i < sl.length; i++) await sl[i].screenshot({ path: `${prefix}-${String(i + 1).padStart(2, '0')}.png` }); }
if (pdfOut) { await p.emulateMediaType('print'); fs.writeFileSync(pdfOut, await p.pdf({ width: '960px', height: '540px', printBackground: true, preferCSSPageSize: true })); console.log('pdf', pdfOut); }
await b.close();
