/**
 * generateQuarterlyPdf.js
 * Builds the complete HTML string that Puppeteer renders into a PDF.
 * Design matches pdf_report_reference.html exactly.
 */

import fs from 'fs';
import path from 'path';
import { isQuarterBefore, getMostRecentPastQuarterWithValue } from '@/lib/quarterly-utils';

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
  const yr = String(d.getFullYear()).slice(2);
  return `${months[d.getMonth()]} '${yr}`;
}

// e.g. Q3 + FY26 → "Q3 FY26"
function quarterFYLabel(quarter, fiscalYear) {
  return `${quarter} ${fiscalYear || 'FY26'}`;
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

html {
  background: #eeeceb;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

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
  height: 1123px;
  position: relative;
  background: #eeeceb;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
}
.page:last-child { page-break-after: avoid; break-after: avoid; }
.page::after {
  content: 'CONFIDENTIAL';
  position: absolute;
  bottom: 12px; left: 0; right: 0;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #888;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  pointer-events: none;
}

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
  right: 28px; bottom: 44px;
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

/* ── Variable sections: hidden until JS assembles them into explicit pages ── */
.pdf-var-section { display: none; width: 794px; }

/* ── TOC anchor links ── */
.toc-row a, .toc-subrow a { color: inherit; text-decoration: none; }
a { cursor: pointer; }

/* ── Tables ── */
.report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
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
/* ── Cover note uses slightly larger body text ── */
.cn-block .body-text { font-size: 14px; line-height: 1.65; }
.cn-block .body-text p { margin-bottom: 11px; }
.cn-block .section-heading { font-size: 15px; }
.subsection-heading { font-size: 12px; font-weight: 700; color: #363636; margin-bottom: 6px; }

/* ── Footnotes ── */
.footnote { font-size: 9px; color: #888; margin-top: 8px; line-height: 1.6; }
.footnote-italic { font-family: 'Inter', sans-serif; font-size: 9px; font-style: italic; color: #888; margin-top: 6px; line-height: 1.6; }

/* ── Div-based table rows — replaces <table> for round details and financials ──
   Divs break mid-flow; <table> elements are treated as atomic by Chrome PDF.   */
.rd-table { width: 100%; }
.rd-row { display: flex; width: 100%; border-bottom: 1px solid #d4d0cc; }
.rd-row:first-child { border-top: 2px solid #830d35; border-bottom: 2px solid #830d35; }
.rd-row:last-child { border-bottom: 2px solid #830d35; }
.rd-cell { padding: 10px 12px; font-size: 12px; color: #363636; min-width: 0; word-break: break-word; }
.rd-row:first-child .rd-cell { font-weight: 700; font-size: 11px; color: #830d35; }

/*=================================================================
  PAGE 1 — COVER
=================================================================*/
.cover-page { background: #830d35; display: flex; flex-direction: column; }
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
.confidentiality-box { border: 1px solid #363636; padding: 16px 20px; margin-top: 8px; }
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
.media-card { border: 1px solid #363636; padding: 16px 20px; width: 55%; }
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
/* LinkedIn banner */
.linkedin-banner {
  display: flex; align-items: center; gap: 14px;
  border: 1px solid #363636; padding: 14px 20px;
  margin-bottom: 16px; text-decoration: none; color: inherit;
}
.linkedin-banner-icon {
  width: 32px; height: 32px;
  background: #0a66c2; color: white;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700;
  flex-shrink: 0;
}
.linkedin-banner-text {
  font-family: 'Inter', sans-serif; font-size: 12px; color: #363636; line-height: 1.4;
}
.linkedin-banner-text strong {
  font-weight: 700;
}
/* Video card */
.video-card {
  display: flex; gap: 0;
  border: 1px solid #363636;
  margin-bottom: 16px;
  overflow: hidden;
  text-decoration: none; color: inherit;
}
.video-thumb-wrap {
  width: 160px; flex-shrink: 0; position: relative; background: #1a1a1a;
  display: flex; align-items: center; justify-content: center; min-height: 90px;
}
.video-thumb {
  width: 160px; height: 90px; object-fit: cover; display: block;
}
.video-thumb-placeholder {
  width: 160px; height: 90px;
  background: #2a2a2a; display: flex; align-items: center; justify-content: center;
}
.video-play-overlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: #363636; padding-left: 3px;
}
.video-card-content {
  padding: 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 6px;
}
.video-card-platform {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; font-weight: 700;
  color: #830d35; text-transform: uppercase; letter-spacing: 0.14em;
}
.video-card-text {
  font-family: 'Inter', sans-serif;
  font-size: 11px; color: #363636; line-height: 1.55;
}
.video-card-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: #888; margin-top: auto;
}
/* Generic social card */
.social-card {
  display: flex; gap: 0;
  border: 1px solid #363636;
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
.contact-box { border: 1px solid rgba(235,222,132,0.45); padding: 20px 24px; width: 70%; }
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
  debugMode = false,
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

  const introHtml = renderPortableText(report.coverNoteIntro);
  const activityHtml = renderPortableText(report.investmentActivityNotes);
  const portfolioHighlightsHtml = renderPortableText(report.portfolioHighlightsNotes);
  const ecosystemHtml = renderPortableText(report.ecosystemNotes);
  const closingHtml = renderPortableText(report.closingNotes);

  const signatory = report.signatory || { name: 'Ganapathy Subramaniam', role: 'Founding Managing Partner' };

  const coverNoteHtml = `
<div class="pdf-var-section" id="section-cover-note">
  <div class="pdf-block cn-block" style="padding: 0 40px;">
    <div class="cover-note-heading">COVER NOTE</div>
  </div>
  ${report.coverNoteGreeting ? `<div class="pdf-block cn-block" style="padding: 0 40px;"><div class="body-text"><p>${esc(report.coverNoteGreeting)}</p></div></div>` : ''}
  ${introHtml ? `<div class="pdf-block cn-block" style="padding: 0 40px;"><div class="body-text">${introHtml}</div></div>` : ''}
  ${activityHtml ? `
  <div class="pdf-block cn-block" style="padding: 0 40px;" data-keep-with-next="true"><div class="section-heading">Investment Activity</div></div>
  <div class="pdf-block cn-block" style="padding: 0 40px;"><div class="body-text">${activityHtml}</div></div>` : ''}
  ${portfolioHighlightsHtml ? `
  <div class="pdf-block cn-block" style="padding: 0 40px;" data-keep-with-next="true"><div class="section-heading">Portfolio Highlights</div></div>
  <div class="pdf-block cn-block" style="padding: 0 40px;"><div class="body-text">${portfolioHighlightsHtml}</div></div>` : ''}
  ${ecosystemHtml ? `
  <div class="pdf-block cn-block" style="padding: 0 40px;" data-keep-with-next="true"><div class="section-heading">Ecosystem &amp; Tailwinds</div></div>
  <div class="pdf-block cn-block" style="padding: 0 40px;"><div class="body-text">${ecosystemHtml}</div></div>` : ''}
  ${closingHtml ? `<div class="pdf-block cn-block" style="padding: 0 40px;" data-keep-with-next="true"><div class="body-text">${closingHtml}</div></div>` : ''}
  <div class="pdf-block cn-block" style="padding: 0 40px;">
    ${signatory?.name ? `<p style="margin-top: 16px; font-family:'Inter',sans-serif; font-size:14px; line-height:1.65;">Warm regards,<br><strong>${esc(signatory.name)}</strong><br>${esc(signatory.role || '')}</p>` : ''}
    <div style="margin-top: 32px;">
      <div class="yali-team-note-label">→ &nbsp; A note from the Yali Team</div>
      <div class="confidentiality-box" style="margin-top: 12px;">
        <p>This report is for your eyes only, and is not meant to be shared, printed or reproduced in any manner, as the data you are about to read is strictly confidential. We appreciate your discretion in this matter.</p>
      </div>
    </div>
  </div>
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
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>First close date</td><td>${fmtDate(fundSettings?.firstCloseDate)}</td></tr>
          <tr><td>Final close date</td><td>${fmtDate(fundSettings?.finalCloseDate)}</td></tr>
          <tr><td>Combined fund size</td><td>${fundSettings?.targetFundSizeINR != null ? fmtCr(fundSettings.targetFundSizeINR) : (fundSettings?.fundSizeAtClose ? fmtCr(fundSettings.fundSizeAtClose) : '—')}</td></tr>
          <tr><td>Amount drawn down as per bank</td><td>${fundMetrics.amountDrawnDown != null ? fmtCr(fundMetrics.amountDrawnDown) : '—'}</td></tr>
          <tr><td>Total invested in portfolio</td><td>${fundMetrics.totalInvestedInPortfolio != null ? fmtCr(fundMetrics.totalInvestedInPortfolio) : '—'}</td></tr>
          <tr><td>Fair Market Value of Portfolio Investments (including realized value)</td><td>${fundMetrics.fmvOfPortfolio != null ? fmtCr(fundMetrics.fmvOfPortfolio) : '—'}</td></tr>
          <tr><td>Number of portfolio companies</td><td>${fundMetrics.numberOfPortfolioCompanies ?? '—'}</td></tr>
          <tr><td>Amount returned (including passive income returned)</td><td>${fundMetrics.amountReturned != null ? fmtCr(fundMetrics.amountReturned) : '—'}</td></tr>
          <tr><td>MOIC</td><td>${fundMetrics.moic != null ? fmt(fundMetrics.moic) + 'x' : '—'}</td></tr>
          <tr><td>TVPI</td><td>${fundMetrics.tvpi != null ? fmt(fundMetrics.tvpi) + 'x' : '—'}</td></tr>
          <tr><td>DPI</td><td>${fundMetrics.dpi != null ? fmt(fundMetrics.dpi) + 'x' : '—'}</td></tr>
          ${fundMetrics.rvpi != null ? `<tr><td>RVPI</td><td>${fmt(fundMetrics.rvpi)}x</td></tr>` : ''}
        </tbody>
      </table>
    </div>
    ${pgNum(fundSumPageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // PAGE 6 — PORTFOLIO INVESTMENTS
  // ════════════════════════════════════════════════════════════
  const portInvPageNum = nextPageNum(); // 6

  const portInvRows = sortedCompanies.map((c, idx) => {
    const displayName = c.entityName || c.name;
    const totalInv = getTotalInvestment(c);
    const ownership = c.quarterData?.currentOwnershipPercent ?? getLatestOwnership(c);
    const ownershipConf = c.quarterData?.currentOwnershipConfidential;
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${esc(displayName)}</td>
        <td>${esc(c.sector || '—')}</td>
        <td>${fmtDate(getInitialInvestmentDate(c))}</td>
        <td>${totalInv ? fmtCr(totalInv) : '—'}</td>
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
            <th style="width:13%;">Yali investment</th>
            <th style="width:14%;">Fully Diluted Ownership (%)</th>
          </tr>
        </thead>
        <tbody>${portInvRows}</tbody>
      </table>
      ${portInvFootnotes ? `<div style="margin-top: 16px;">${portInvFootnotes}</div>` : ''}
    </div>
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
    const fmv = qd?.currentFMV ?? getMostRecentPastQuarterWithValue(company, quarter, fiscalYear, 'currentFMV')?.currentFMV;
    const fmvConf = qd?.currentFMVConfidential;
    const moic = qd?.multipleOfInvestment;
    const moicConf = qd?.moicConfidential;
    const roundMoics = qd?.roundMoics || [];

    // MOIC marker: use custom snapshot-moic footnote marker if present, otherwise ★
    const customMoicFn = (qd?.tableFootnotes || []).find(f => f.tableType === 'snapshot' && f.fieldName === 'snapshot-moic' && f.marker);
    const moicMarkerHtml = customMoicFn
      ? `<sup style="font-size:9px;line-height:0;vertical-align:super;">${esc(customMoicFn.marker)}</sup>`
      : ' ★';
    const defaultMoicFootnote = roundMoics.length > 0 && !customMoicFn
      ? `<div class="footnote-italic">★ MOIC is based on Price Round (unaudited)</div>`
      : '';

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

    nextPageNum(); // company section start
    nextPageNum(); // kept for TOC page-counter accuracy (was page C)

    const roundsRows = allRounds.map(r => {
      const label = r.roundLabel || roundNameToLabel(r.roundName);
      const dateStr = r.investmentDate ? fmtMonthYear(r.investmentDate) : '';
      return `<tr><td>• ${esc(label)}${dateStr ? ` (${esc(dateStr)})` : ''}</td><td>${r.yaliInvestment != null ? fmtCr(r.yaliInvestment) : '—'}</td></tr>`;
    }).join('');

    const roundMoicRows = roundMoics.map(rm => {
      const label = roundNameToLabel(rm.roundName);
      return `<tr><td>MOIC ${esc(label)}${moicMarkerHtml}</td><td>${rm.moic != null ? fmt(rm.moic) + 'x' : '—'}</td></tr>`;
    }).join('');

    // ── Sort all quarterly updates most recent first ──
    const allUpdates = [...(company.quarterlyUpdates || [])].sort((a, b) => {
      const key = u => parseInt((u.fiscalYear || '').replace('FY', '') || '0', 10) * 10
        + parseInt((u.quarter || 'Q0').replace('Q', ''), 10);
      return key(b) - key(a);
    });

    // Footnotes fall back to the most recent past quarter that has matching footnotes,
    // so a footnote entered once persists until explicitly overridden in a later quarter.
    function effectiveFootnotes() {
      return qd?.tableFootnotes || null;
    }

    // Returns superscript HTML for a footnote marker tied to a specific table field.
    function fnMarker(tableType, fieldName) {
      const fns = effectiveFootnotes();
      const fn = fns?.find(f => f.tableType === tableType && f.fieldName === fieldName && f.marker);
      return fn ? `<sup style="font-size:9px;line-height:0;vertical-align:super;">${esc(fn.marker)}</sup>` : '';
    }

    const snapshotFootnotes = renderTableFootnotes(effectiveFootnotes(), 'snapshot');

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

    const aboutText = company.aboutCompany || company.detail || '';

    // ── Build <tr> rows for investment round details ──
    // Each detail row is its own <tr> so Chrome breaks between rows at the page
    // boundary naturally — no "block fits on next page, move it" optimization.
    const financialsUpdates = allUpdates.slice(0, 5);
    const hasRevPat = financialsUpdates.some(u => u.revenueINR != null || u.patINR != null);
    const hasKeyMetrics = (currentQUpdate?.keyMetrics || qd?.keyMetrics || []).length > 0;

    // Helper: one <tr> containing a flex row, with optional top/bottom borders on the <td>
    function flexTr(cells, { topBorder = false, bottomBorder = 'thin', isHeader = false, extraTopPadding = 0 } = {}) {
      const CR = '#830d35', DIV = '#d4d0cc';
      const tdStyle = [
        'padding: 0 40px;',
        topBorder ? `border-top: 2px solid ${CR};` : '',
        bottomBorder === 'thick' ? `border-bottom: 2px solid ${CR};` : '',
        bottomBorder === 'thin' ? `border-bottom: 1px solid ${DIV};` : '',
        extraTopPadding ? `padding-top: ${extraTopPadding}px;` : '',
      ].join('');
      const textStyle = isHeader
        ? `font-weight:700;font-size:11px;color:${CR};`
        : 'font-size:12px;color:#363636;';
      const divCells = cells.map((c, i) =>
        `<div style="${i === 0 ? 'width:34%;' : 'flex:1;'}padding:10px 12px;${textStyle}">${c}</div>`
      ).join('');
      return `<tr><td style="${tdStyle}"><div style="display:flex;">${divCells}</div></td></tr>`;
    }

    let rdBlocks = '';
    if (allRounds.length > 0) {
      const roundMoicsMap = {};
      roundMoics.forEach(rm => { roundMoicsMap[rm.roundName] = rm.moic; });

      const rdFields = [
        ['Pre-money valuation', 'rounds-premoney', r => r.preMoneyValuation != null ? fmtCr(r.preMoneyValuation) : '—'],
        ['Total round size', 'rounds-size', r => r.totalRoundSize != null ? fmtCr(r.totalRoundSize) : '—'],
        ['Post-money valuation', 'rounds-postmoney', r => r.postMoneyValuation != null ? fmtCr(r.postMoneyValuation) : '—'],
        ["Yali's investment", 'rounds-yali-investment', r => r.yaliInvestment != null ? fmtCr(r.yaliInvestment) : '—'],
        ["Yali's ownership in %", 'rounds-ownership', r => r.yaliOwnership != null ? fmt(r.yaliOwnership, 2) : '—'],
        ...(Object.keys(roundMoicsMap).length > 0
          ? [['MOIC', null, r => roundMoicsMap[r.roundName] != null ? fmt(roundMoicsMap[r.roundName]) + 'x' : '—']]
          : []),
      ];

      const roundsFootnotes = renderTableFootnotes(effectiveFootnotes(), 'rounds');

      rdBlocks = `<div class="pdf-block" style="padding: 0 40px 12px;">
        <div class="section-heading" style="font-size:16px;margin-bottom:8px;">Investment round details</div>
        <div class="rd-table">
          <div class="rd-row">
            <div class="rd-cell" style="width:34%;">Stage</div>
            ${allRounds.map(r => `<div class="rd-cell" style="flex:1;">${esc(r.roundLabel || roundNameToLabel(r.roundName))}</div>`).join('')}
          </div>
          ${rdFields.map(([label, fieldName, getValue]) => `
          <div class="rd-row">
            <div class="rd-cell" style="width:34%;">${esc(label)}${fieldName ? fnMarker('rounds', fieldName) : ''}</div>
            ${allRounds.map(r => `<div class="rd-cell" style="flex:1;">${esc(String(getValue(r)))}</div>`).join('')}
          </div>`).join('')}
        </div>
        ${roundsFootnotes ? `<div class="footnote" style="padding:4px 0 0;">${roundsFootnotes}</div>` : ''}
      </div>`;
    }

    let finBlocks = '';
    if (hasRevPat || hasKeyMetrics) {
      const kmItems = currentQUpdate?.keyMetrics || qd?.keyMetrics || [];
      const qLabels = financialsUpdates.map(u => esc(quarterFYLabel(u.quarter, u.fiscalYear)));
      const financialsFootnotes = renderTableFootnotes(effectiveFootnotes(), 'financials');

      const finDataRows = [];
      const finDataFieldNames = [];
      if (hasRevPat) {
        finDataRows.push(['Revenue', ...financialsUpdates.map(u =>
          u.revenueConfidential ? '**' : (u.revenueINR != null ? fmt(u.revenueINR) : '—'))]);
        finDataFieldNames.push('financials-revenue');
        finDataRows.push(['PAT', ...financialsUpdates.map(u => {
          if (u.patConfidential) return '**';
          if (u.patINR == null) return '—';
          return u.patINR < 0 ? `(${fmt(Math.abs(u.patINR))})` : fmt(u.patINR);
        })]);
        finDataFieldNames.push('financials-pat');
      }
      kmItems.forEach(km => {
        finDataRows.push([esc(km.label || ''), esc(km.value || ''), ...financialsUpdates.slice(1).map(() => '—')]);
        finDataFieldNames.push('financials-metric');
      });

      finBlocks = `<div class="pdf-block" style="padding: 12px 40px 20px;">
        <div class="section-heading" style="font-size:16px;margin-bottom:8px;">Financials / Key matrix</div>
        <div class="rd-table">
          <div class="rd-row">
            <div class="rd-cell" style="width:34%;">Particulars</div>
            ${qLabels.map(l => `<div class="rd-cell" style="flex:1;">${l}</div>`).join('')}
          </div>
          ${finDataRows.map((cells, i) => {
            const fieldName = finDataFieldNames[i];
            const [label, ...rest] = cells;
            return `<div class="rd-row">
              <div class="rd-cell" style="width:34%;">${label}${fieldName ? fnMarker('financials', fieldName) : ''}</div>
              ${rest.map(v => `<div class="rd-cell" style="flex:1;">${v}</div>`).join('')}
            </div>`;
          }).join('')}
        </div>
        <div class="footnote" style="padding:4px 0 0;">All figures in ₹ Cr${financialsFootnotes ? '<br>' + financialsFootnotes : ''}</div>
      </div>`;
    }

    return `
<div class="pdf-var-section">
  <div class="pdf-block" style="padding: 0 40px 0;">
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
        <tr><td style="width:55%;">Latest funding round${fnMarker('snapshot', 'snapshot-latest-round')}</td><td>${esc(getLatestRoundLabel(company))}</td></tr>
        ${allRounds.length > 0 ? `
          <tr class="table-section-header"><td colspan="2">Investment rounds</td></tr>
          ${roundsRows}` : ''}
        <tr><td>Total investment${fnMarker('snapshot', 'snapshot-total-investment')}</td><td>${totalInv ? fmtCr(totalInv) : '—'}</td></tr>
        <tr><td>Ownership (FD)${fnMarker('snapshot', 'snapshot-ownership')}</td><td>${ownershipConf ? '**' : fmtPct(ownership)}</td></tr>
        <tr><td>Current FMV${fnMarker('snapshot', 'snapshot-fmv')}</td><td>${fmvConf ? '**' : (fmv != null ? fmtCr(fmv) : '—')}</td></tr>
        ${roundMoicRows}
        <tr><td>MOIC Cumulative${roundMoics.length > 0 ? moicMarkerHtml : ''}</td><td>${moicConf ? '**' : (moic != null ? fmt(moic) + 'x' : '—')}</td></tr>
        ${coInvestors.length > 0 ? `<tr><td>Key co-investors${fnMarker('snapshot', 'snapshot-coinvestors')}</td><td>${coInvestors.length === 1 ? esc(coInvestors[0]) : coInvestors.map((ci, i) => `${i + 1}. ${esc(ci)}`).join('<br>')}</td></tr>` : ''}
      </tbody>
    </table>
    ${snapshotFootnotes || defaultMoicFootnote}
  </div>

  ${aboutText ? `
  <div class="pdf-block" style="padding: 0 40px;">
    <div class="body-text" style="margin-top: 20px;">
      <div class="subsection-heading">About the company</div>
      <p>${esc(aboutText)}</p>
    </div>
  </div>` : ''}

  <div class="pdf-block" style="padding: 0 40px;">
    <div style="margin-top: 20px;">
      <div class="prev-quarters-label" style="color:#830d35;font-size:18px;font-weight:700;margin-bottom:10px;">Quarter updates</div>
      ${currentQHtml}
    </div>
  </div>

  ${prevQUpdates.length > 0 ? `
  <div class="pdf-block" style="padding: 0 40px;">
    <div class="prev-quarters-heading" style="margin-top: 16px;">
      <div class="prev-quarters-label">Previous quarters</div>
      <div class="prev-quarters-line"></div>
    </div>
  </div>
  ${prevQUpdates.map(u => `
  <div class="pdf-block" style="padding: 0 40px;">
    <div class="quarter-label">${esc(quarterFYLabel(u.quarter, u.fiscalYear))}</div>
    <div class="body-text" style="color:#888;">${renderPortableText(u.updateNotes)}</div>
  </div>`).join('')}` : ''}

  ${(rdBlocks || finBlocks) ? `
  <div class="pdf-block" style="padding: 0 40px;">
    <div class="section-divider" style="margin-top: 20px; margin-bottom: 0;"></div>
  </div>
  ${rdBlocks}
  ${finBlocks}` : ''}
</div>`;
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

  function renderMediaNotesBlocks(blocks) {
    if (!blocks || !Array.isArray(blocks)) return '';
    return blocks.map(block => {
      if (block._type !== 'block') return '';
      const html = (block.children || []).map(span => {
        if (span._type !== 'span') return '';
        let text = esc(span.text || '');
        const marks = span.marks || [];
        const linkMark = marks.find(m => block.markDefs && block.markDefs.some(d => d._key === m && d._type === 'link'));
        if (linkMark) {
          const def = block.markDefs.find(d => d._key === linkMark);
          text = `<a href="${esc(def.href)}" style="color:#830d35;text-decoration:underline;">${text}</a>`;
        } else {
          if (marks.includes('strong')) text = `<strong>${text}</strong>`;
          if (marks.includes('em')) text = `<em>${text}</em>`;
        }
        return text;
      }).join('');
      return `<p style="margin-bottom:6px;">${html}</p>`;
    }).join('');
  }

  const linkedInUpdates = (quarterSocialUpdates || []).filter(i => i.platform === 'linkedin');
  const videoUpdates = (quarterSocialUpdates || []).filter(i => i.platform === 'video');
  const otherUpdates = (quarterSocialUpdates || []).filter(i => i.platform !== 'linkedin' && i.platform !== 'video');

  const linkedInBannerHtml = linkedInUpdates.length > 0
    ? (() => {
        const linkedInUrl = linkedInUpdates[0]?.url || 'https://linkedin.com/company/yalicapital';
        return `<a href="${esc(linkedInUrl)}" class="linkedin-banner">
          <div class="linkedin-banner-icon">in</div>
          <div class="linkedin-banner-text"><strong>We're active on LinkedIn.</strong> Follow us for fund updates, portfolio news, and deeptech insights.</div>
        </a>`;
      })()
    : '';

  const videoCardsHtml = videoUpdates.map(item => {
    const excerpt = item.excerpt
      ? (item.excerpt.length > 120 ? item.excerpt.substring(0, 120) + '…' : item.excerpt)
      : '';
    const thumbEl = item.imageUrl
      ? `<img class="video-thumb" src="${esc(item.imageUrl)}" alt="">`
      : `<div class="video-thumb-placeholder"></div>`;
    const card = `
      <div class="video-card">
        <div class="video-thumb-wrap">
          ${thumbEl}
          <div class="video-play-overlay">▶</div>
        </div>
        <div class="video-card-content">
          <div class="video-card-platform">Video</div>
          ${excerpt ? `<div class="video-card-text">${esc(excerpt)}</div>` : ''}
          <div class="video-card-date">${esc(fmtShortDate(item.date))}</div>
        </div>
      </div>`;
    return item.url
      ? `<a href="${esc(item.url)}" style="display:block;text-decoration:none;color:inherit;">${card}</a>`
      : card;
  }).join('');

  const otherCardsHtml = otherUpdates.map(item => {
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
  }).join('');

  const hasSocialUpdates = (quarterSocialUpdates || []).length > 0;
  const socialCardsHtml = hasSocialUpdates
    ? `<div class="social-updates-heading">Social Updates</div>` +
      linkedInBannerHtml + videoCardsHtml + otherCardsHtml
    : '';

  const hasMedia = mediaItems.length > 0 || hasSocialUpdates;

  const mediaHtml = `
<div class="pdf-var-section" id="section-media">
  <div class="pdf-block" style="padding: 0 40px 0;">
    <div class="media-heading-wrap">
      <div class="media-heading">IN THE MEDIA</div>
      <div class="media-arrow">↗</div>
    </div>
    <div class="media-subhead">Key highlights and press coverage</div>
    ${report.mediaNotes && Array.isArray(report.mediaNotes) && report.mediaNotes.length > 0 ? `<div class="body-text" style="margin: 12px 0 4px;">${renderMediaNotesBlocks(report.mediaNotes)}</div>` : ''}
    <div class="section-divider-light"></div>
  </div>
  ${mediaCardsHtml ? `<div class="pdf-block" style="padding: 0 40px;"><div class="media-cards">${mediaCardsHtml}</div></div>` : ''}
  ${hasSocialUpdates ? `<div class="pdf-block" style="padding: 0 40px;">${socialCardsHtml}</div>` : ''}
  ${!hasMedia ? `<div class="pdf-block" style="padding: 0 40px;"><p style="color:#888;font-size:12px;padding-top:16px;">No media items recorded for this quarter.</p></div>` : ''}
</div>`;

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
  // Page numbers here are initial estimates; pdfRequestHandler's page.evaluate()
  // measures actual rendered heights and overwrites each [data-toc-page] span.
  const tocHtml = `
  <div class="page">
    <div class="toc-wrap">
      <div class="toc-title">TABLE OF<br>CONTENTS</div>
      <table class="toc-table">
        <tr class="toc-row"><td><a href="#section-cover-note">Cover note</a></td><td><a href="#section-cover-note"><span data-toc-page="section-cover-note">${cn1PageNum}</span></a></td></tr>
        <tr class="toc-row"><td><a href="#section-fund-summary">Fund summary</a></td><td><a href="#section-fund-summary"><span data-toc-page="section-fund-summary">${fundSumPageNum}</span></a></td></tr>
        <tr class="toc-row"><td><a href="#section-portfolio-inv">Portfolio investments</a></td><td><a href="#section-portfolio-inv"><span data-toc-page="section-portfolio-inv">${portInvPageNum}</span></a></td></tr>
        <tr class="toc-subrow"><td><a href="#section-portfolio-inv">• Portfolio investment summary</a></td><td><a href="#section-portfolio-inv"><span data-toc-page="section-portfolio-inv">${portInvPageNum}</span></a></td></tr>
        <tr class="toc-subrow"><td><a href="#section-portfolio-updates">• Portfolio company updates</a></td><td><a href="#section-portfolio-updates"><span data-toc-page="section-portfolio-updates">${portSepPageNum}</span></a></td></tr>
        <tr class="toc-row"><td><a href="#section-fund-fin">Fund financials</a></td><td><a href="#section-fund-fin"><span data-toc-page="section-fund-fin">${fundFinPageNum}</span></a></td></tr>
        <tr class="toc-row"><td><a href="#section-pipeline">Pipeline summary</a></td><td><a href="#section-pipeline"><span data-toc-page="section-pipeline">${pipelinePageNum}</span></a></td></tr>
        <tr class="toc-row"><td><a href="#section-media">Media coverage</a></td><td><a href="#section-media"><span data-toc-page="section-media">${mediaPageNum}</span></a></td></tr>
        <tr class="toc-row"><td><a href="#section-contact">Contact information</a></td><td><a href="#section-contact"><span data-toc-page="section-contact">${contactPageNum}</span></a></td></tr>
      </table>
    </div>
    ${pgNum(tocPageNum)}
  </div>`;

  // ════════════════════════════════════════════════════════════
  // ASSEMBLE
  // ════════════════════════════════════════════════════════════
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(reportTitle)}</title>
  <style>${buildFontFaceCSS()}\n${CSS}</style>
  <style>
    @media screen {
      html { background: #c8c8c8; }
      body { background: transparent; width: auto; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 24px; }
      .page { box-shadow: 0 4px 24px rgba(0,0,0,0.22); }
    }
  </style>
</head>
<body>
<div id="tpl-page-header" style="display:none;">${headerHtml()}</div>
${coverHtml}
${tocHtml}
${coverNoteHtml}
${debugMode ? '' : fundSumHtml}
${debugMode ? '' : portInvHtml}
${debugMode ? '' : portSepHtml}
${debugMode ? '' : companyPagesHtml}
${debugMode ? '' : fundFinHtml}
${debugMode ? '' : pipelineHtml}
${debugMode ? '' : mediaHtml}
${debugMode ? '' : contactHtml}
<script>
(function paginatePdf() {
  var A4_H = 1123, A4_W = 794, PAD_V = 28, PAGE_NUM_ZONE = 78;
  var tplEl = document.getElementById('tpl-page-header');
  var HEADER_HTML = tplEl.innerHTML;
  var testHdr = document.createElement('div');
  testHdr.style.cssText = 'position:absolute;left:-99999px;top:0;width:794px;display:block;';
  testHdr.innerHTML = HEADER_HTML;
  document.body.appendChild(testHdr);
  var HEADER_H = Math.ceil(testHdr.getBoundingClientRect().height);
  document.body.removeChild(testHdr);
  var AVAIL_H = A4_H - HEADER_H - PAD_V * 2 - PAGE_NUM_ZONE;
  var vfPath = 'd="M24 4C24 1.79086 25.7909 0 28 0V24V28H24H0C0 25.7909 1.79086 24 4 24L24 24V4Z"';
  var VF_TL = '<svg class="pn-tl" width="18" height="18" viewBox="0 0 28 28" fill="none" style="transform:rotate(180deg)"><path fill-rule="evenodd" clip-rule="evenodd" ' + vfPath + ' fill="#363636"/></svg>';
  var VF_BR = '<svg class="pn-br" width="18" height="18" viewBox="0 0 28 28" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" ' + vfPath + ' fill="#363636"/></svg>';
  function makePage(id) {
    var pg = document.createElement('div');
    pg.className = 'page';
    if (id) pg.id = id;
    pg.innerHTML = HEADER_HTML +
      '<div class="pdf-content-area" style="padding:' + PAD_V + 'px 0 ' + PAD_V + 'px; max-height:' + AVAIL_H + 'px; overflow:hidden;"></div>' +
      '<div class="page-number">' + VF_TL + '<span></span>' + VF_BR + '</div>';
    return { el: pg, content: pg.querySelector('.pdf-content-area'), used: 0 };
  }
  var sections = document.querySelectorAll('.pdf-var-section');
  sections.forEach(function(section) {
    var sectionId = section.id;
    var parent = section.parentNode;
    section.style.cssText = 'position:absolute;left:-99999px;top:0;width:' + A4_W + 'px;display:block;visibility:hidden;';
    var blocks = Array.from(section.querySelectorAll(':scope > .pdf-block'));
    var heights = blocks.map(function(b) { return b.getBoundingClientRect().height + 4; });
    section.style.cssText = 'display:none;';
    var first = makePage(sectionId || null);
    parent.insertBefore(first.el, section);
    var cur = first;
    for (var i = 0; i < blocks.length; i++) {
      var h = heights[i];
      var nextH = (blocks[i].dataset.keepWithNext === 'true' && i + 1 < blocks.length) ? heights[i + 1] : 0;
      var need = h + nextH;
      if (cur.used > 0 && cur.used + need > AVAIL_H) {
        var np = makePage(null);
        parent.insertBefore(np.el, section);
        cur = np;
      }
      cur.content.appendChild(blocks[i].cloneNode(true));
      cur.used += h;
    }
    parent.removeChild(section);
  });
  // Fill page number spans for HTML preview (page.evaluate() overwrites in Puppeteer)
  var allPages = Array.from(document.querySelectorAll('.page'));
  allPages.forEach(function(pg, idx) {
    var span = pg.querySelector('.page-number span:not(.pn-tl):not(.pn-br)');
    if (span && !span.textContent) span.textContent = 'Page ' + (idx + 1);
  });
})();
</script>
</body>
</html>`;
}
