/**
 * generateQuarterlyPdf.js
 * Builds the complete HTML string that Puppeteer renders into a PDF.
 * Design matches pdf_report_reference.html exactly.
 */

import fs from 'fs';
import path from 'path';
import { isQuarterBefore } from '@/lib/quarterly-utils';

function loadFontBase64(filename) {
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', filename);
    return fs.readFileSync(fontPath).toString('base64');
  } catch {
    return null;
  }
}

function buildFontFaceCSS() {
  const fonts = [
    { file: 'Inter-400.ttf', family: 'Inter', weight: 400 },
    { file: 'Inter-700.ttf', family: 'Inter', weight: 700 },
    { file: 'JetBrainsMono-400.ttf', family: 'JetBrains Mono', weight: 400 },
    { file: 'JetBrainsMono-700.ttf', family: 'JetBrains Mono', weight: 700 },
  ];
  return fonts.map(({ file, family, weight }) => {
    const b64 = loadFontBase64(file);
    if (!b64) return '';
    return `@font-face { font-family: '${family}'; font-weight: ${weight}; font-style: normal; src: url('data:font/truetype;base64,${b64}') format('truetype'); }`;
  }).join('\n');
}

// ── Utility helpers ────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(val, decimals = 2) {
  if (val === undefined || val === null) return '—';
  return Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCr(val) {
  if (val === undefined || val === null) return '—';
  return `₹${fmt(val)} Cr`;
}

function fmtPct(val) {
  if (val === undefined || val === null) return '—';
  return `${fmt(val, 2)}%`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yr = String(d.getFullYear()).slice(2);
  return `${d.getDate()} ${months[d.getMonth()]} '${yr}`;
}

function fmtMonthYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// e.g. Q3 + FY26 → "Q3 2025-26"
function quarterFYLabel(quarter, fiscalYear) {
  const fyNum = parseInt((fiscalYear || 'FY26').replace('FY', ''), 10);
  const endYear = fyNum < 50 ? 2000 + fyNum : 1900 + fyNum;
  const startYear = endYear - 1;
  return `${quarter} ${startYear}-${String(endYear).slice(2)}`;
}

function roundNameToLabel(roundName) {
  if (!roundName) return '—';
  return roundName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Render Portable Text blocks to HTML
function renderPortableText(blocks) {
  if (!blocks || !Array.isArray(blocks)) {
    if (typeof blocks === 'string' && blocks.trim()) {
      return `<p>${esc(blocks)}</p>`;
    }
    return '';
  }
  const parts = [];
  let listItems = [];
  let listType = null;

  function flushList() {
    if (listItems.length) {
      const tag = listType === 'number' ? 'ol' : 'ul';
      parts.push(`<${tag}>${listItems.join('')}</${tag}>`);
      listItems = [];
      listType = null;
    }
  }

  for (const block of blocks) {
    if (block._type !== 'block') continue;

    const inline = (block.children || []).map(child => {
      let t = esc(child.text || '');
      const marks = child.marks || [];
      if (marks.includes('strong')) t = `<strong>${t}</strong>`;
      if (marks.includes('em')) t = `<em>${t}</em>`;
      return t;
    }).join('');

    if (block.listItem) {
      if (listType && listType !== block.listItem) flushList();
      listType = block.listItem;
      listItems.push(`<li>${inline}</li>`);
    } else {
      flushList();
      if (block.style === 'h3') {
        parts.push(`<div class="section-heading">${inline}</div>`);
      } else if (block.style === 'h4') {
        parts.push(`<div class="subsection-heading">${inline}</div>`);
      } else if (inline) {
        parts.push(`<p>${inline}</p>`);
      }
    }
  }
  flushList();
  return parts.join('');
}

// Render tableFootnotes array (items have .marker, .text)
function renderTableFootnotes(footnotes, tableType) {
  if (!footnotes || !Array.isArray(footnotes)) return '';
  return footnotes
    .filter(f => (!tableType || f.tableType === tableType) && f.text)
    .map(f => `<div class="footnote-italic">${f.marker ? esc(f.marker) + ' ' : ''}${esc(f.text)}</div>`)
    .join('');
}

function getTotalInvestment(company) {
  return (company?.investmentRounds || []).reduce((s, r) => s + (r.yaliInvestment || 0), 0);
}

const SUPPLEMENTARY_ROUND_TYPES = new Set(['bridge', 'ccd-conversion', 'follow-on']);

function getLatestRoundLabel(company) {
  const rounds = (company?.investmentRounds || []).filter(r => r.roundName);
  if (!rounds.length) return '—';
  // Prefer the last primary round (not a bridge/follow-on/conversion);
  // fall back to the actual last round if all are supplementary.
  const primary = rounds.filter(r => !SUPPLEMENTARY_ROUND_TYPES.has(r.roundName));
  const latest = primary.length ? primary[primary.length - 1] : rounds[rounds.length - 1];
  return latest?.roundLabel || roundNameToLabel(latest?.roundName) || '—';
}

function getLatestOwnership(company) {
  const rounds = [...(company?.investmentRounds || [])].filter(r => r.yaliOwnership != null);
  if (!rounds.length) return null;
  return rounds[rounds.length - 1].yaliOwnership;
}

function getInitialInvestmentDate(company) {
  const rounds = company?.investmentRounds || [];
  if (!rounds.length) return null;
  const initial = rounds.find(r => r.isInitialRound) || rounds[0];
  return initial?.investmentDate || null;
}

// ── CSS ────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'JetBrains Mono', monospace;
  color: #363636;
  background: #eeeceb;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

@page { size: A4; margin: 0; }

.page {
  width: 794px;
  min-height: 1123px;
  position: relative;
  background: #eeeceb;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
}
.page:last-child { page-break-after: avoid; break-after: avoid; }

/* ── Shared header ── */
.page-header {
  display: flex;
  align-items: center;
  padding: 20px 40px 16px;
}
.logo-img {
  width: 52px; height: 52px;
  object-fit: contain;
  flex-shrink: 0;
}
.header-line {
  flex: 1;
  height: 1.5px;
  background: #830d35;
  margin: 0 20px;
}
.header-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #363636;
  white-space: nowrap;
}

/* ── Page body ── */
.page-body { padding: 28px 40px 100px; }

/* ── Page number — viewfinder icon ── */
.page-number {
  position: absolute;
  right: 28px; bottom: 20px;
  height: 34px;
  display: flex;
  align-items: stretch;
  gap: 8px;
  font-size: 11px;
  color: #363636;
  line-height: 1;
  page-break-inside: avoid;
  break-inside: avoid;
}
.page-number span { align-self: center; }
.page-number .pn-tl { align-self: flex-start; }
.page-number .pn-br { align-self: flex-end; }

/* ── Confidential footer ── */
.footer-confidential {
  position: absolute;
  bottom: 28px; left: 0; right: 0;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #888;
}

/* ── Company A+B flowing section — table layout so <thead> repeats on every printed page ── */
.company-ab-table {
  width: 794px;
  border-collapse: collapse;
  background: #eeeceb;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  page-break-after: always;
  break-after: page;
}
.company-ab-table thead tr td {
  background: #eeeceb;
  padding: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.company-ab-table tbody tr td {
  background: #eeeceb;
  vertical-align: top;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Media page — same table pattern so header repeats if social cards overflow ── */
.media-page-table {
  width: 794px;
  border-collapse: collapse;
  background: #eeeceb;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  page-break-after: always;
  break-after: page;
}
.media-page-table thead tr td,
.media-page-table tbody tr td {
  background: #eeeceb;
  padding: 0;
  vertical-align: top;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── TOC anchor links ── */
.toc-row a, .toc-subrow a { color: inherit; text-decoration: none; }
a { cursor: pointer; }

/* ── Tables ── */
.report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
/* Only prevent table splits inside the flowing company A+B section */
.company-ab-table .report-table { page-break-inside: avoid; break-inside: avoid; }
.report-table th {
  font-weight: 700;
  font-size: 11px;
  color: #830d35;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid #830d35;
  border-top: 2px solid #830d35;
}
.report-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #d4d0cc;
  color: #363636;
  font-size: 12px;
  vertical-align: top;
}
.report-table tr:last-child td { border-bottom: 2px solid #830d35; }
.table-section-header td {
  background: #830d35;
  color: #efefef;
  font-weight: 700;
  font-size: 11px;
  padding: 8px 12px;
  border-bottom: none !important;
}

/* ── Dividers ── */
.section-divider { width: 100%; height: 2px; background: #830d35; margin: 12px 0 16px; }
.section-divider-light { width: 100%; height: 1px; background: #d4d0cc; margin: 12px 0; }

/* ── Body text — Inter only ── */
.body-text { font-family: 'Inter', sans-serif; font-size: 12px; line-height: 1.7; color: #363636; }
.body-text p { margin-bottom: 10px; }
.body-text ul, .body-text ol { padding-left: 18px; margin-bottom: 10px; }
.body-text li { margin-bottom: 5px; }
.section-heading { font-size: 13px; font-weight: 700; color: #830d35; margin-bottom: 6px; margin-top: 12px; }
.subsection-heading { font-size: 12px; font-weight: 700; color: #363636; margin-bottom: 6px; }

/* ── Footnotes ── */
.footnote { font-size: 9px; color: #888; margin-top: 8px; line-height: 1.6; }
.footnote-italic { font-family: 'Inter', sans-serif; font-size: 9px; font-style: italic; color: #888; margin-top: 6px; line-height: 1.6; }

/*=================================================================
  PAGE 1 — COVER
=================================================================*/
/* Cover page: fixed A4 height to prevent overflow onto page 2 */
.cover-page { height: 1123px; min-height: unset; overflow: hidden; background: #830d35; display: flex; flex-direction: column; }
.cover-header { background: #efefef; height: 110px; flex-shrink: 0; padding: 0 36px; display: flex; align-items: center; gap: 20px; }
.cover-logo-block { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.cover-logo-wordmark {
  font-size: 13px; font-weight: 700;
  color: #363636; letter-spacing: 0.12em;
  text-transform: uppercase; line-height: 1.3;
}
.cover-header-line { flex: 1; height: 1px; background: #830d35; margin: 0 16px; }
.cover-quarter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; font-weight: 500;
  letter-spacing: 0.1em; color: #363636; flex-shrink: 0;
}
.cover-body { flex: 1; min-height: 0; background: #830d35; display: flex; flex-direction: column; align-items: center; padding: 52px 48px 40px; overflow: hidden; }
.heading-xl {
  font-size: 72px; font-weight: 900;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: #efefef; line-height: 1.0;
  width: 100%; text-align: center; margin-bottom: 20px; flex-shrink: 0;
}
.cover-tagline {
  font-size: 22px; font-weight: 500;
  color: rgba(239,239,239,0.92);
  margin-bottom: 48px; line-height: 1.4; text-align: center;
  width: 100%; flex-shrink: 0;
}
.cover-svg-wrap {
  flex: 1; min-height: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  width: 100%;
}
.cover-svg-wrap svg { width: 420px; max-height: 100%; opacity: 0.55; }
.cover-footer-text {
  width: 100%; flex-shrink: 0;
  display: flex; justify-content: flex-end;
  padding-top: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; line-height: 1.6;
  color: rgba(239,239,239,0.75); text-align: right;
}

/*=================================================================
  PAGE 2 — TABLE OF CONTENTS
=================================================================*/
.toc-wrap { position: relative; padding: 0 40px 80px; min-height: 1000px; }
.toc-title {
  font-size: 80px; font-weight: 900;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: #363636; line-height: 0.95;
  padding-top: 180px; margin-bottom: 32px;
  position: relative; z-index: 1;
}
.toc-table { width: 100%; border-collapse: collapse; }
.toc-row td {
  padding: 14px 12px;
  border-bottom: 1px dashed #aaa;
  font-size: 13px; color: #363636;
}
.toc-row td:last-child {
  text-align: right; font-variant-numeric: tabular-nums;
  color: #830d35; font-weight: 600;
}
.toc-subrow td {
  padding: 12px 12px 12px 28px;
  border-bottom: 1px dashed #aaa;
  font-size: 12px; color: #555;
}
.toc-subrow td:last-child { text-align: right; color: #830d35; font-weight: 600; }

/*=================================================================
  PAGES 3-4 — COVER NOTE
=================================================================*/
.cover-note-heading {
  font-size: 60px; font-weight: 900;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: #363636; line-height: 1;
  margin: 16px 0 28px;
}
.yali-team-note-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; font-weight: 700;
  color: #363636;
  margin-bottom: 10px;
  border-left: 3px solid #830d35;
  padding-left: 10px;
}
.confidentiality-box { border: 1px solid #c0bfbf; padding: 16px 20px; margin-top: 8px; }
.confidentiality-box p { font-family: 'Inter', sans-serif; font-size: 11px; color: #555; line-height: 1.6; }

/*=================================================================
  PAGE 5 — FUND SUMMARY
=================================================================*/
.fund-summary-heading {
  font-size: 64px; font-weight: 300;
  letter-spacing: 0.05em; color: #363636;
  line-height: 1; margin: 12px 0 6px;
}
.fund-summary-sub { font-size: 12px; color: #555; margin-bottom: 8px; }

/*=================================================================
  PAGE 6 — PORTFOLIO INVESTMENTS
=================================================================*/
.portfolio-inv-heading {
  font-size: 68px; font-weight: 900;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: #363636; line-height: 0.95;
  margin: 12px 0 20px;
}

/*=================================================================
  SEPARATOR PAGES
=================================================================*/
.separator-title-mixed {
  font-size: 60px; font-weight: 400;
  color: #830d35; line-height: 1.05;
  padding: 20px 40px 0;
  max-width: 400px;
}
.heading-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 52px; font-weight: 400;
  color: #830d35; line-height: 1.1;
}

/*=================================================================
  COMPANY PAGES
=================================================================*/
.company-heading-wrap { display: flex; align-items: center; gap: 20px; margin: 12px 0 24px; }
.company-logo-box { width: 54px; height: 54px; flex-shrink: 0; }
.company-logo-box img { width: 100%; height: 100%; object-fit: contain; }
.company-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 26px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: #363636; line-height: 1.15;
}
.company-logo-placeholder {
  width: 54px; height: 54px;
  background: #d4d0cc;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700; font-size: 18px; color: #830d35;
}

/* Quarter updates */
.prev-quarters-heading {
  display: flex; align-items: center; gap: 16px;
  margin: 24px 0 16px;
}
.prev-quarters-label {
  font-size: 16px; font-weight: 700;
  color: #830d35; white-space: nowrap;
}
.prev-quarters-line { flex: 1; height: 1px; background: #aaa; }
.quarter-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; font-weight: 600;
  color: #555; margin-bottom: 8px; margin-top: 16px;
}

/*=================================================================
  MEDIA PAGE
=================================================================*/
.media-heading-wrap { display: flex; align-items: flex-start; gap: 12px; margin: 8px 0 4px; }
.media-heading {
  font-family: 'JetBrains Mono', monospace;
  font-size: 48px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: #363636; line-height: 1;
}
.media-arrow { font-size: 52px; color: #363636; font-weight: 300; line-height: 1; }
.media-subhead { font-size: 13px; color: #555; margin-bottom: 16px; }
.media-cards { display: flex; flex-direction: column; gap: 20px; }
.media-card { border: 1px solid #c0bfbf; padding: 16px 20px; width: 55%; }
.media-card.right { margin-left: auto; }
.media-card-date { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #555; margin-bottom: 8px; }
.media-card-title { font-size: 14px; font-weight: 400; color: #363636; line-height: 1.4; margin-bottom: 8px; }
.media-card-source { font-size: 12px; font-weight: 700; color: #555; }

/*=================================================================
  SOCIAL UPDATE CARDS
=================================================================*/
.social-updates-heading {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #363636; margin: 28px 0 14px;
}
.social-card {
  display: flex; gap: 0;
  border: 1px solid #c0bfbf;
  margin-bottom: 16px;
  overflow: hidden;
}
.social-card-image {
  width: 130px; flex-shrink: 0;
  object-fit: cover; display: block;
}
.social-card-image-placeholder {
  width: 130px; flex-shrink: 0;
  background: #d4d0cc;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: #888; font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.social-card-content {
  padding: 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 6px;
}
.social-card-platform {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; font-weight: 700;
  color: #830d35; text-transform: uppercase; letter-spacing: 0.14em;
}
.social-card-text {
  font-family: 'Inter', sans-serif;
  font-size: 11px; color: #363636; line-height: 1.55;
}
.social-card-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: #888; margin-top: auto;
}

/*=================================================================
  CONTACT PAGE
=================================================================*/
.contact-page { background: #830d35; position: relative; overflow: hidden; }
.contact-heading {
  font-family: 'JetBrains Mono', monospace;
  font-size: 52px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: #efefef; line-height: 1;
  padding: 64px 56px 48px;
}
.contact-boxes { padding: 0 56px; display: flex; flex-direction: column; gap: 20px; }
.contact-box { border: 1px solid rgba(239,239,239,0.4); padding: 20px 24px; width: 70%; }
.contact-box-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #efefef;
}
.contact-box-link { text-decoration: underline; }
`;

// ── Main export ────────────────────────────────────────────────

export function generatePdfHtml({
  quarter,
  fiscalYear,
  asOf,
  reportTitle,
  fundSettings,
  fundMetrics,
  portfolioCompanies,
  report,
  quarterSocialUpdates = [],
  coverSvgHtml = '',
  portfolioUpdatesSvgHtml = '',
  fundFinancialsSvgHtml = '',
  pipelineSvgHtml = '',
}) {
  // Sort companies by initial investment date ascending — matches portal table order
  const sortedCompanies = [...portfolioCompanies].sort((a, b) => {
    const dateA = getInitialInvestmentDate(a) || '';
    const dateB = getInitialInvestmentDate(b) || '';
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
  });

  const quarterLabel = `${quarter} ${fiscalYear}`;
  const logoUrl = fundSettings?.logoLight || '';
  let pageNum = 0;

  function nextPageNum() { return ++pageNum; }

  function headerHtml() {
    return `
      <div class="page-header">
        ${logoUrl ? `<img class="logo-img" src="${esc(logoUrl)}" alt="Yali Capital">` : ''}
        <div class="header-line"></div>
        <span class="header-label">Quarterly Report ${esc(quarterLabel)}</span>
      </div>`;
  }

  const vfPath = `d="M24 4C24 1.79086 25.7909 0 28 0V24V28H24H0C0 25.7909 1.79086 24 4 24L24 24V4Z"`;
  const vfBr = `<svg class="pn-br" width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" ${vfPath} fill="#363636"/></svg>`;
  const vfTl = `<svg class="pn-tl" width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(180deg)"><path fill-rule="evenodd" clip-rule="evenodd" ${vfPath} fill="#363636"/></svg>`;

  function pgNum(n) {
    return `<div class="page-number">${vfTl}<span>Page ${n}</span>${vfBr}</div>`;
  }

  function confFooter() {
    return `<div class="footer-confidential">Confidential</div>`;
  }

  // ════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════
  nextPageNum(); // page 1 — no number shown on cover

  const coverHtml = `
  <div class="page cover-page">
    <div class="cover-header">
      <div class="cover-logo-block">
        ${logoUrl ? `<img class="logo-img" src="${esc(logoUrl)}" alt="Yali Capital">` : ''}
        <div class="cover-logo-wordmark">YALI<br>CAPITAL</div>
      </div>
      <div class="cover-header-line"></div>
      <span class="cover-quarter">${esc(quarterLabel)}</span>
    </div>
    <div class="cover-body">
      <div class="heading-xl">QUARTERLY<br>REPORT</div>
      <div class="cover-tagline">${esc(report?.subtitle || fundSettings?.tagline || "Taking India's Deep Tech to new heights")}</div>
      <div class="cover-svg-wrap">${coverSvgHtml}</div>
      <div class="cover-footer-text">
        ${esc(fundSettings?.fundManagerName || fundSettings?.fundName || 'Yali Partners LLP')}<br>
        ${esc(fundSettings?.fundManagerDescriptor || 'Investment Manager – Deep Tech Focus')}
      </div>
    </div>
  </div>`;

  // ════════════════════════════════════════════════════════════
  // PAGE 2 — TABLE OF CONTENTS
  // ════════════════════════════════════════════════════════════
  const tocPageNum = nextPageNum(); // 2
  // tocHtml is built after all sections so page numbers are accurate — see below.

  // ════════════════════════════════════════════════════════════
  // PAGES 3-4 — COVER NOTE
  // ════════════════════════════════════════════════════════════
  const cn1PageNum = nextPageNum(); // 3
  const cn2PageNum = nextPageNum(); // 4

  const introHtml = renderPortableText(report.coverNoteIntro);
  const activityHtml = renderPortableText(report.investmentActivityNotes);
  const portfolioHighlightsHtml = renderPortableText(report.portfolioHighlightsNotes);
  const ecosystemHtml = renderPortableText(report.ecosystemNotes);
  const closingHtml = renderPortableText(report.closingNotes);

  const coverNoteP1Html = `
  <div class="page" id="section-cover-note" style="max-height: 1123px; overflow: hidden;">
    ${headerHtml()}
    <div class="page-body">
      <div class="cover-note-heading">COVER NOTE</div>
      <div class="body-text">
        ${report.coverNoteGreeting ? `<p>${esc(report.coverNoteGreeting)}</p>` : ''}
        ${introHtml}
        ${activityHtml ? `<div class="section-heading">Investment Activity</div>${activityHtml}` : ''}
        ${portfolioHighlightsHtml ? `<div class="section-heading">Portfolio Highlights</div>${portfolioHighlightsHtml}` : ''}
      </div>
    </div>
    ${pgNum(cn1PageNum)}
  </div>`;

  const signatory = report.signatory || { name: 'Ganapathy Subramaniam', role: 'Founding Managing Partner' };

  const coverNoteP2Html = `
  <div class="page" data-section-end="true" style="max-height: 1123px; overflow: hidden;">
    ${headerHtml()}
    <div class="page-body">
      <div class="body-text">
        ${ecosystemHtml ? `<div class="section-heading">Ecosystem &amp; Tailwinds</div>${ecosystemHtml}` : ''}
        ${closingHtml}
        ${signatory?.name ? `<p style="margin-top: 16px;">Warm regards,<br><strong>${esc(signatory.name)}</strong><br>${esc(signatory.role || '')}</p>` : ''}
      </div>
      <div style="margin-top: 32px;">
        <div class="yali-team-note-label">→ &nbsp; A note from the Yali Team</div>
        <div class="confidentiality-box" style="margin-top: 12px;">
          <p>Dear Limited Partner,</p>
          <br>
          <p>This report is for your eyes only, and is not meant to be shared, printed or reproduced in any manner, as the data you are about to read is strictly confidential. We appreciate your discretion in this matter.</p>
        </div>
      </div>
    </div>
    ${pgNum(cn2PageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // PAGE 5 — FUND SUMMARY
  // ════════════════════════════════════════════════════════════
  const fundSumPageNum = nextPageNum(); // 5

  const fundSumHtml = `
  <div class="page" id="section-fund-summary" data-section-end="true">
    ${headerHtml()}
    <div class="page-body">
      <div class="fund-summary-heading">Fund Summary</div>
      <div class="fund-summary-sub">As of ${esc(asOf)}</div>
      <table class="report-table">
        <thead>
          <tr>
            <th style="width: 65%;">As of ${esc(asOf)}</th>
            <th>Amount in ₹ crores</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>First close date</td><td>${fmtDate(fundSettings?.firstCloseDate)}</td></tr>
          <tr><td>Final close date</td><td>${fmtDate(fundSettings?.finalCloseDate)}</td></tr>
          <tr><td>Combined fund size</td><td>${fundSettings?.targetFundSizeINR != null ? fmt(fundSettings.targetFundSizeINR) : (fundSettings?.fundSizeAtClose ? fmt(fundSettings.fundSizeAtClose) : '—')}</td></tr>
          <tr><td>Amount drawn down as per bank</td><td>${fundMetrics.amountDrawnDown != null ? fmt(fundMetrics.amountDrawnDown) : '—'}</td></tr>
          <tr><td>Total invested in portfolio</td><td>${fundMetrics.totalInvestedInPortfolio != null ? fmt(fundMetrics.totalInvestedInPortfolio) : '—'}</td></tr>
          <tr><td>Fair Market Value of Portfolio Investments (including realised value)</td><td>${fundMetrics.fmvOfPortfolio != null ? fmt(fundMetrics.fmvOfPortfolio) : '—'}</td></tr>
          <tr><td>Number of portfolio companies</td><td>${fundMetrics.numberOfPortfolioCompanies ?? '—'}</td></tr>
          <tr><td>Amount returned (including passive income returned)</td><td>${fundMetrics.amountReturned != null ? fmt(fundMetrics.amountReturned) : '—'}</td></tr>
          <tr><td>MOIC</td><td>${fundMetrics.moic != null ? fmt(fundMetrics.moic) + 'x' : '—'}</td></tr>
          <tr><td>TVPI</td><td>${fundMetrics.tvpi != null ? fmt(fundMetrics.tvpi) + 'x' : '—'}</td></tr>
          <tr><td>DPI</td><td>${fundMetrics.dpi != null ? fmt(fundMetrics.dpi, 4) + 'x' : '—'}</td></tr>
          ${fundMetrics.rvpi != null ? `<tr><td>RVPI</td><td>${fmt(fundMetrics.rvpi)}x</td></tr>` : ''}
        </tbody>
      </table>
    </div>
    ${confFooter()}
    ${pgNum(fundSumPageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // PAGE 6 — PORTFOLIO INVESTMENTS
  // ════════════════════════════════════════════════════════════
  const portInvPageNum = nextPageNum(); // 6

  const portInvRows = sortedCompanies.map((c, idx) => {
    const entityName = c.entityName || c.name;
    const totalInv = getTotalInvestment(c);
    const ownership = c.quarterData?.currentOwnershipPercent ?? getLatestOwnership(c);
    const ownershipConf = c.quarterData?.currentOwnershipConfidential;
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${esc(entityName)}</td>
        <td>${esc(c.sector || '—')}</td>
        <td>${fmtDate(getInitialInvestmentDate(c))}</td>
        <td>${totalInv ? fmt(totalInv) : '—'}</td>
        <td>${ownershipConf ? '**' : fmtPct(ownership)}</td>
      </tr>`;
  }).join('');

  const portInvFootnotes = renderTableFootnotes(report.portfolioSummaryFootnotes);

  const portInvHtml = `
  <div class="page" id="section-portfolio-inv" data-section-end="true">
    ${headerHtml()}
    <div class="page-body">
      <div class="portfolio-inv-heading">PORTFOLIO<br>INVESTMENTS</div>
      <table class="report-table">
        <thead>
          <tr>
            <th style="width:8%;">Sl No.</th>
            <th style="width:30%;">Company</th>
            <th style="width:20%;">Sector</th>
            <th style="width:15%;">Initial Investment Date</th>
            <th style="width:13%;">Amount in ₹ (Crores)</th>
            <th style="width:14%;">Fully Diluted Ownership (%)</th>
          </tr>
        </thead>
        <tbody>${portInvRows}</tbody>
      </table>
      ${portInvFootnotes ? `<div style="margin-top: 16px;">${portInvFootnotes}</div>` : ''}
    </div>
    ${confFooter()}
    ${pgNum(portInvPageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // PAGE 7 — SEPARATOR: Portfolio Company Updates
  // ════════════════════════════════════════════════════════════
  const portSepPageNum = nextPageNum(); // 7

  const portSepHtml = `
  <div class="page" id="section-portfolio-updates">
    ${headerHtml()}
    <div style="position: relative; padding: 24px 40px; overflow: hidden; min-height: 900px;">
      <div class="separator-title-mixed">Portfolio<br>Company<br>Updates</div>
      <div style="width: 50%; height: 1.5px; background: #830d35; margin-top: 24px;"></div>
      ${portfolioUpdatesSvgHtml ? `
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -20%); width: 80px; opacity: 0.15;">
          ${portfolioUpdatesSvgHtml}
        </div>` : ''}
    </div>
    ${confFooter()}
    ${pgNum(portSepPageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // PAGES 8+ — PER-COMPANY PAGES (3 pages each)
  // ════════════════════════════════════════════════════════════
  const companyPagesHtml = sortedCompanies.map(company => {
    const qd = company.quarterData;
    // Only include rounds with a roundName — matches portal's sortedRoundsOldestFirst filter.
    // Rounds with only a roundLabel (e.g. bridge rounds entered without a structured name) are
    // excluded from latest-round display, the rounds table, and co-investor lookups.
    const allRounds = (company.investmentRounds || []).filter(r => r.roundName);
    const totalInv = getTotalInvestment(company);
    const ownership = qd?.currentOwnershipPercent ?? getLatestOwnership(company);
    const ownershipConf = qd?.currentOwnershipConfidential;
    const fmv = qd?.currentFMV;
    const fmvConf = qd?.currentFMVConfidential;
    const moic = qd?.multipleOfInvestment;
    const moicConf = qd?.moicConfidential;
    const roundMoics = qd?.roundMoics || [];

    // Co-investors from the latest investment round only
    const latestRound = allRounds[allRounds.length - 1];
    const coInvestors = (latestRound?.coInvestors || [])
      .filter(ci => ci?.name)
      .sort((a, b) => {
        const aOrder = a.displayOrder ?? Infinity;
        const bOrder = b.displayOrder ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
      })
      .map(ci => ci.name);

    nextPageNum(); // A+B merged section (page badge not shown; JS corrects C page numbers post-render)

    const roundsRows = allRounds.map(r => {
      const label = r.roundLabel || roundNameToLabel(r.roundName);
      const dateStr = r.investmentDate ? fmtMonthYear(r.investmentDate) : '';
      return `<tr><td>• ${esc(label)}${dateStr ? ` (${esc(dateStr)})` : ''}</td><td>${r.yaliInvestment != null ? fmt(r.yaliInvestment) : '—'}</td></tr>`;
    }).join('');

    const roundMoicRows = roundMoics.map(rm => {
      const label = roundNameToLabel(rm.roundName);
      return `<tr><td>MOIC ${esc(label)} ★</td><td>${rm.moic != null ? fmt(rm.moic) + 'x' : '—'}</td></tr>`;
    }).join('');

    const snapshotFootnotes = renderTableFootnotes(qd?.tableFootnotes, 'snapshot');
    const defaultMoicFootnote = roundMoics.length > 0 && !snapshotFootnotes
      ? `<div class="footnote-italic">★ MOIC is based on Price Round (unaudited)</div>`
      : '';

    // ── Sort all quarterly updates most recent first (needed by both A+B and C) ──
    const allUpdates = [...(company.quarterlyUpdates || [])].sort((a, b) => {
      const key = u => parseInt((u.fiscalYear || '').replace('FY', '') || '0', 10) * 10
        + parseInt((u.quarter || 'Q0').replace('Q', ''), 10);
      return key(b) - key(a);
    });

    const currentQUpdate = allUpdates.find(u => u.quarter === quarter && u.fiscalYear === fiscalYear);

    // All previous quarters (most recent first), filtered to have content
    const allPrevWithNotes = allUpdates.filter(u =>
      isQuarterBefore(u.quarter, u.fiscalYear, quarter, fiscalYear) && u.updateNotes
    );
    // Q1: show last 2 quarters (from previous FY). All other quarters: show all within the same FY.
    const prevQUpdates = quarter === 'Q1'
      ? allPrevWithNotes.slice(0, 2)
      : allPrevWithNotes.filter(u => u.fiscalYear === fiscalYear);

    const currentQHtml = currentQUpdate?.updateNotes
      ? `<div class="subsection-heading">${esc(quarterFYLabel(currentQUpdate.quarter, currentQUpdate.fiscalYear))}</div>
         <div class="body-text">${renderPortableText(currentQUpdate.updateNotes)}</div>`
      : '';

    const prevQHtml = prevQUpdates
      .map(u => `
        <div class="quarter-label">${esc(quarterFYLabel(u.quarter, u.fiscalYear))}</div>
        <div class="body-text" style="color: #888;">${renderPortableText(u.updateNotes)}</div>`)
      .join('');

    const aboutText = company.aboutCompany || company.detail || '';

    // ── MERGED PAGE A+B: Snapshot table + About + Quarter Updates ───────────────
    // Uses <table> + <thead> so the page header repeats automatically on every printed page
    // when content overflows to a second A4 sheet.
    const abSectionHtml = `
  <table class="company-ab-table" data-section-end="true">
    <thead>
      <tr><td>${headerHtml()}</td></tr>
    </thead>
    <tbody>
      <tr><td class="page-body" style="padding-bottom: 100px;">
        <div class="company-heading-wrap">
          <div class="company-logo-box">
            ${company.logo
              ? `<img src="${esc(company.logo)}" alt="${esc(company.name)}">`
              : `<div class="company-logo-placeholder">${esc((company.name || '?')[0].toUpperCase())}</div>`}
          </div>
          <div class="company-name">${esc((company.entityName || company.name || '').toUpperCase())}</div>
        </div>
        <table class="report-table">
          <tbody>
            <tr><td style="width:55%;">Latest funding round</td><td>${esc(getLatestRoundLabel(company))}</td></tr>
            ${allRounds.length > 0 ? `
              <tr class="table-section-header"><td colspan="2">Investment rounds</td></tr>
              ${roundsRows}` : ''}
            <tr><td>Total investment</td><td>${totalInv ? fmt(totalInv) : '—'}</td></tr>
            <tr><td>Ownership (FD)</td><td>${ownershipConf ? '**' : fmtPct(ownership)}</td></tr>
            <tr><td>Current FMV</td><td>${fmvConf ? '**' : (fmv != null ? fmt(fmv) : '—')}</td></tr>
            ${roundMoicRows}
            <tr><td>MOIC Cumulative${roundMoics.length > 0 ? ' ★' : ''}</td><td>${moicConf ? '**' : (moic != null ? fmt(moic) + 'x' : '—')}</td></tr>
            ${coInvestors.length > 0 ? `<tr><td>Key co-investors</td><td>${coInvestors.length === 1 ? esc(coInvestors[0]) : coInvestors.map((ci, i) => `${i + 1}. ${esc(ci)}`).join('<br>')}</td></tr>` : ''}
          </tbody>
        </table>
        ${snapshotFootnotes || defaultMoicFootnote}
        ${aboutText ? `
          <div class="body-text" style="margin-top: 28px;">
            <div class="subsection-heading">About the company</div>
            <p>${esc(aboutText)}</p>
          </div>` : ''}
        <div style="margin-top: 24px;">
          <div class="prev-quarters-label" style="color: #830d35; font-size: 18px; font-weight: 700; margin-bottom: 12px;">Quarter updates</div>
          ${currentQHtml}
        </div>
        ${prevQHtml ? `
          <div class="prev-quarters-heading">
            <div class="prev-quarters-label">Previous quarters</div>
            <div class="prev-quarters-line"></div>
          </div>
          ${prevQHtml}` : ''}
      </td></tr>
    </tbody>
  </table>`;

    // ── PAGE C: Round Details + Financials ───────────────────
    const pageCNum = nextPageNum(); // C gets the displayed page number

    // Transposed investment rounds table
    let roundDetailsHtml = '';
    if (allRounds.length > 0) {
      const colWidth = Math.max(26, Math.floor((100 - 34) / allRounds.length));
      const labelColWidth = 100 - colWidth * allRounds.length;

      const roundMoicsMap = {};
      roundMoics.forEach(rm => { roundMoicsMap[rm.roundName] = rm.moic; });

      const stageRow = `<tr>
        <td style="width:${labelColWidth}%;">Stage</td>
        ${allRounds.map(r => `<td>${esc(r.roundLabel || roundNameToLabel(r.roundName))}</td>`).join('')}
      </tr>`;

      const fields = [
        ['Pre-money valuation', r => r.preMoneyValuation != null ? fmt(r.preMoneyValuation) : '—'],
        ['Total round size', r => r.totalRoundSize != null ? fmt(r.totalRoundSize) : '—'],
        ['Post-money valuation', r => r.postMoneyValuation != null ? fmt(r.postMoneyValuation) : '—'],
        ["Yali's investment", r => r.yaliInvestment != null ? fmt(r.yaliInvestment) : '—'],
        ["Yali's ownership in %", r => r.yaliOwnership != null ? fmt(r.yaliOwnership, 2) : '—'],
        ...(Object.keys(roundMoicsMap).length > 0
          ? [['MOIC', r => roundMoicsMap[r.roundName] != null ? fmt(roundMoicsMap[r.roundName]) + 'x' : '—']]
          : []),
      ];

      const dataRows = fields.map(([label, getValue]) =>
        `<tr>
          <td>${esc(label)}</td>
          ${allRounds.map(r => `<td>${esc(String(getValue(r)))}</td>`).join('')}
        </tr>`).join('');

      const roundsFootnotes = renderTableFootnotes(qd?.tableFootnotes, 'rounds');

      roundDetailsHtml = `
        <div class="section-heading" style="font-size: 16px; margin-bottom: 8px;">Investment round details</div>
        <table class="report-table">
          <tbody>
            ${stageRow}
            ${dataRows}
          </tbody>
        </table>
        <div class="footnote">All figures except percentages are in ₹ crore</div>
        ${roundsFootnotes}`;
    }

    // Financials table (up to 5 most recent quarters)
    const financialsUpdates = allUpdates.slice(0, 5);
    const hasRevPat = financialsUpdates.some(u => u.revenueINR != null || u.patINR != null);
    const hasKeyMetrics = (currentQUpdate?.keyMetrics || qd?.keyMetrics || []).length > 0;

    let financialsHtml = '';
    if (hasRevPat || hasKeyMetrics) {
      const qHeaders = financialsUpdates.map(u =>
        `<th>${esc(quarterFYLabel(u.quarter, u.fiscalYear))}</th>`).join('');

      const revCells = financialsUpdates.map(u => {
        if (u.revenueConfidential) return '<td>**</td>';
        return `<td>${u.revenueINR != null ? fmt(u.revenueINR) : '—'}</td>`;
      }).join('');

      const patCells = financialsUpdates.map(u => {
        if (u.patConfidential) return '<td>**</td>';
        if (u.patINR == null) return '<td>—</td>';
        return `<td>${u.patINR < 0 ? `(${fmt(Math.abs(u.patINR))})` : fmt(u.patINR)}</td>`;
      }).join('');

      const kmItems = currentQUpdate?.keyMetrics || qd?.keyMetrics || [];
      const keyMetricRows = kmItems.map(km =>
        `<tr>
          <td>${esc(km.label || '')}</td>
          <td>${esc(km.value || '')}</td>
          ${financialsUpdates.slice(1).map(() => '<td>—</td>').join('')}
        </tr>`).join('');

      const financialsFootnotes = renderTableFootnotes(qd?.tableFootnotes, 'financials');

      financialsHtml = `
        <div style="margin-top: 24px;">
          <div class="section-heading" style="font-size: 16px; margin-bottom: 8px;">Financials / Key matrix</div>
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 34%;">Particulars</th>
                ${qHeaders}
              </tr>
            </thead>
            <tbody>
              ${hasRevPat ? `
                <tr><td>Revenue</td>${revCells}</tr>
                <tr><td>PAT</td>${patCells}</tr>` : ''}
              ${keyMetricRows}
            </tbody>
          </table>
          <div class="footnote">All figures except percentages are in ₹ crore</div>
          ${financialsFootnotes}
        </div>`;
    }

    const pageCHtml = `
  <div class="page" data-section-end="true">
    ${headerHtml()}
    <div class="page-body">
      ${roundDetailsHtml || '<p style="color: #888; font-size: 12px;">No investment round details available.</p>'}
      ${financialsHtml}
    </div>
    ${confFooter()}
    ${pgNum(pageCNum)}
  </div>`;

    return abSectionHtml + pageCHtml;
  }).join('');

  // ════════════════════════════════════════════════════════════
  // SEPARATOR — Fund Financials
  // ════════════════════════════════════════════════════════════
  const fundFinPageNum = nextPageNum();

  const fundFinHtml = `
  <div class="page" id="section-fund-fin">
    ${headerHtml()}
    <div style="padding: 24px 40px; position: relative; min-height: 900px;">
      <div class="heading-mono">Fund<br>financials</div>
      <div style="margin-top: 12px; font-size: 13px; color: #555;">
        Available on <a href="https://partners.yali.vc" style="color:#555;text-decoration:underline;">partners.yali.vc</a>
      </div>
      ${fundFinancialsSvgHtml ? `
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 70px; opacity: 0.18;">
          ${fundFinancialsSvgHtml}
        </div>` : ''}
    </div>
    ${confFooter()}
    ${pgNum(fundFinPageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // SEPARATOR — Pipeline Summary
  // ════════════════════════════════════════════════════════════
  const pipelinePageNum = nextPageNum();
  const pipelineNotesHtml = renderPortableText(report.pipelineNotes);

  const pipelineHtml = `
  <div class="page" id="section-pipeline">
    ${headerHtml()}
    <div style="padding: 24px 40px; position: relative; min-height: 900px;">
      <div class="heading-mono">Pipeline<br>summary</div>
      ${pipelineNotesHtml ? `
        <div class="body-text" style="margin-top: 28px; max-width: 560px;">
          ${pipelineNotesHtml}
        </div>` : ''}
      ${pipelineSvgHtml ? `
        <div style="position: absolute; left: 50%; bottom: 100px; transform: translateX(-50%); width: 90px; opacity: 0.18;">
          ${pipelineSvgHtml}
        </div>` : ''}
    </div>
    ${confFooter()}
    ${pgNum(pipelinePageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // MEDIA COVERAGE
  // ════════════════════════════════════════════════════════════
  const mediaPageNum = nextPageNum();

  function fmtShortDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
  }

  const mediaItems = report.mediaFromNews && report.mediaFromNews.length > 0
    ? report.mediaFromNews : [];

  const mediaCardsHtml = mediaItems.length > 0
    ? mediaItems.map((item, idx) => `
        <div class="media-card${idx % 2 === 1 ? ' right' : ''}">
          <div class="media-card-date">${esc(fmtShortDate(item.date))}</div>
          <div class="media-card-title">${esc(item.headlineEdited || '')}</div>
          ${item.isVideo && item.videoSource === 'youtube' ? `<div class="media-card-source" style="color:#cc0000;">▶ YouTube</div>` : item.publicationName ? `<div class="media-card-source">${esc(item.publicationName)}</div>` : ''}
          ${item.url ? `<div style="margin-top:10px;"><a href="${esc(item.url)}" style="font-size:12px;font-weight:700;color:#363636;text-decoration:underline;">${item.isVideo && item.videoSource === 'youtube' ? 'Watch on YouTube ↗' : item.isVideo ? 'Watch ↗' : 'Read more'}</a></div>` : ''}
        </div>`).join('')
    : '';

  function platformLabel(platform) {
    if (platform === 'linkedin') return 'LinkedIn';
    if (platform === 'twitter') return 'Twitter / X';
    if (platform === 'video') return 'Video';
    return 'Social';
  }

  const socialCardsHtml = (quarterSocialUpdates || []).length > 0
    ? `<div class="social-updates-heading">Social Updates</div>` +
      quarterSocialUpdates.map(item => {
        const excerpt = item.excerpt
          ? (item.excerpt.length > 120 ? item.excerpt.substring(0, 120) + '…' : item.excerpt)
          : '';
        const imageEl = item.imageUrl
          ? `<img class="social-card-image" src="${esc(item.imageUrl)}" alt="">`
          : `<div class="social-card-image-placeholder">${esc(platformLabel(item.platform))}</div>`;
        const cardInner = `
          <div class="social-card">
            ${imageEl}
            <div class="social-card-content">
              <div class="social-card-platform">${esc(platformLabel(item.platform))}</div>
              ${excerpt ? `<div class="social-card-text">${esc(excerpt)}</div>` : ''}
              <div class="social-card-date">${esc(fmtShortDate(item.date))}</div>
            </div>
          </div>`;
        return item.url
          ? `<a href="${esc(item.url)}" style="display:block;text-decoration:none;color:inherit;">${cardInner}</a>`
          : cardInner;
      }).join('')
    : '';

  const hasMedia = mediaItems.length > 0 || (quarterSocialUpdates || []).length > 0;

  // Use <table> + <thead> so the page header repeats automatically if social cards overflow to a second page
  const mediaHtml = `
  <table class="media-page-table" id="section-media">
    <thead><tr><td>${headerHtml()}</td></tr></thead>
    <tbody><tr><td style="padding: 28px 40px 80px;">
      <div class="media-heading-wrap">
        <div class="media-heading">IN THE MEDIA</div>
        <div class="media-arrow">↗</div>
      </div>
      <div class="media-subhead">Key highlights and press coverage</div>
      ${report.mediaNotes ? `<div class="body-text" style="margin: 12px 0 4px;"><p>${esc(report.mediaNotes)}</p></div>` : ''}
      <div class="section-divider-light"></div>
      ${mediaCardsHtml ? `<div class="media-cards">${mediaCardsHtml}</div>` : ''}
      ${socialCardsHtml}
      ${!hasMedia ? '<p style="color:#888;font-size:12px;padding-top:16px;">No media items recorded for this quarter.</p>' : ''}
    </td></tr></tbody>
  </table>`;

  // ════════════════════════════════════════════════════════════
  // CONTACT INFORMATION (last page)
  // ════════════════════════════════════════════════════════════
  const contactPageNum = nextPageNum();
  const websiteDisplay = fundSettings?.website
    ? fundSettings.website.replace(/^https?:\/\//, '').replace(/\/$/, '').toUpperCase()
    : null;

  const irEmail = fundSettings?.investorRelationsEmail;

  const contactHtml = `
  <div class="page contact-page" id="section-contact">
    <div class="contact-heading">CONTACT<br>INFORMATION</div>
    <div class="contact-boxes">
      ${websiteDisplay ? `
        <div class="contact-box">
          <div class="contact-box-text">
            <a href="${esc(fundSettings.website)}/newsroom" class="contact-box-link" style="color:#efefef;">${esc(websiteDisplay)}/NEWSROOM</a> FOR ALL MEDIA COVERAGE
          </div>
        </div>` : ''}
      ${irEmail ? `
        <div class="contact-box">
          <div class="contact-box-text">
            <a href="mailto:${esc(irEmail)}" class="contact-box-link" style="color:#efefef;">${esc(irEmail.toUpperCase())}</a> FOR INVESTOR QUERIES
          </div>
        </div>` : ''}
      ${fundSettings?.fundName ? `
        <div class="contact-box">
          <div class="contact-box-text">${esc(fundSettings.fundName.toUpperCase())}</div>
        </div>` : ''}
    </div>
  </div>`;

  // ════════════════════════════════════════════════════════════
  // TABLE OF CONTENTS — built last so all page numbers are known
  // ════════════════════════════════════════════════════════════
  const tocHtml = `
  <div class="page">
    <div class="toc-wrap">
      <div class="toc-title">TABLE OF<br>CONTENTS</div>
      <table class="toc-table">
        <tr class="toc-row"><td><a href="#section-cover-note">Cover note</a></td><td><a href="#section-cover-note">${cn1PageNum}</a></td></tr>
        <tr class="toc-row"><td><a href="#section-fund-summary">Fund summary</a></td><td><a href="#section-fund-summary">${fundSumPageNum}</a></td></tr>
        <tr class="toc-row"><td><a href="#section-portfolio-inv">Portfolio investments</a></td><td><a href="#section-portfolio-inv">${portInvPageNum}</a></td></tr>
        <tr class="toc-subrow"><td><a href="#section-portfolio-inv">• Portfolio investment summary</a></td><td><a href="#section-portfolio-inv">${portInvPageNum}</a></td></tr>
        <tr class="toc-subrow"><td><a href="#section-portfolio-updates">• Portfolio company updates</a></td><td><a href="#section-portfolio-updates">${portSepPageNum}</a></td></tr>
        <tr class="toc-row"><td><a href="#section-fund-fin">Fund financials</a></td><td><a href="#section-fund-fin">${fundFinPageNum}</a></td></tr>
        <tr class="toc-row"><td><a href="#section-pipeline">Pipeline summary</a></td><td><a href="#section-pipeline">${pipelinePageNum}</a></td></tr>
        <tr class="toc-row"><td><a href="#section-media">Media coverage</a></td><td><a href="#section-media">${mediaPageNum}</a></td></tr>
        <tr class="toc-row"><td><a href="#section-contact">Contact information</a></td><td><a href="#section-contact">${contactPageNum}</a></td></tr>
      </table>
    </div>
    ${pgNum(tocPageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // SVG injection: fill sections with >50% empty space
  // ════════════════════════════════════════════════════════════
  const svgPool = [coverSvgHtml, portfolioUpdatesSvgHtml, fundFinancialsSvgHtml, pipelineSvgHtml].filter(Boolean);
  const svgPoolJson = JSON.stringify(svgPool).replace(/<\/script>/gi, '<\\/script>');

  const svgInjectionScript = svgPool.length > 0 ? `
<script>
(function() {
  var svgs = ${svgPoolJson};
  var PAGE_H = 1123;
  var pages = document.querySelectorAll('.page[data-section-end]');
  for (var i = 0; i < pages.length; i++) {
    var page = pages[i];
    var header = page.querySelector('.page-header');
    var body = page.querySelector('.page-body');
    if (!body) continue;
    var headerH = header ? header.offsetHeight : 88;
    var bodyH = body.scrollHeight;
    var used = headerH + bodyH;
    if (used >= PAGE_H * 0.5) continue;
    var idx = Math.floor(Math.random() * svgs.length);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;bottom:80px;right:0;left:0;display:flex;justify-content:center;pointer-events:none;';
    wrap.innerHTML = svgs[idx];
    var svgEl = wrap.querySelector('svg');
    if (svgEl) {
      svgEl.style.cssText = 'width:336px;height:auto;opacity:0.18;display:block;';
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
    }
    page.appendChild(wrap);
  }
})();
</script>` : '';

  // ════════════════════════════════════════════════════════════
  // ASSEMBLE
  // ════════════════════════════════════════════════════════════
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(reportTitle)}</title>
  <style>${buildFontFaceCSS()}\n${CSS}</style>
</head>
<body>
${coverHtml}
${tocHtml}
${coverNoteP1Html}
${coverNoteP2Html}
${fundSumHtml}
${portInvHtml}
${portSepHtml}
${companyPagesHtml}
${fundFinHtml}
${pipelineHtml}
${mediaHtml}
${contactHtml}
${svgInjectionScript}
</body>
</html>`;
}
