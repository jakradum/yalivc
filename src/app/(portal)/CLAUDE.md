# LP Portal — Agent Context

> Loaded automatically when touching files under `src/app/(portal)/`. Root `CLAUDE.md` is also loaded and contains the design system, routing, env vars, and global rules.

---

## Auth — Portal (`portal-session` cookie)

- OTP flow via `/api/portal-auth/route.js`
- Page-level verification: `src/lib/session.js` (Node.js `crypto`, server components only)
- Standard page pattern:
  ```js
  const cookieValue = cookieStore.get('portal-session')?.value;
  const userEmail = cookieValue ? verifySession(cookieValue) : null;
  if (cookieValue && userEmail === null) redirect('/partners/sign-in');
  ```
- `redirect` must be imported from `next/navigation`, NOT `next/headers`
- Trusted domains (bypass portalUser lookup): `@yali.vc`, `@florintree.com`
- Access condition: `portalUser` Sanity doc with `lpPortalAccess == true` OR `(!defined(lpPortalAccess) && isActive == true)`
- Kill switch: `noAccess: true` on `portalUser` blocks access even for trusted domains

---

## Quarterly Logic

- Indian fiscal year quarters: Q1=Apr–Jun, Q2=Jul–Sep, Q3=Oct–Dec, Q4=Jan–Mar
- Fiscal year label: "FY26" = April 2025 – March 2026
- All quarter period logic lives in `src/lib/quarterly-utils.js` — check here before writing any date/quarter handling
- Company detail pages show investment rounds filtered to the **current quarter only** — use `filterInvestmentRounds(rounds, quarterEndDate, nextQuarterEndDate)` from `quarterly-utils.js`
- FMV/metrics fallback: only use past quarters, never future — use `getMostRecentPastQuarterData()` not `latestQuarter` or `quarterlyUpdates[0]`

---

## Access Rules

- Internal reports (`visibility: 'internal'`) are restricted to `@yali.vc` email addresses only
- Do not add `generateStaticParams` to any portal page — all pages require runtime auth checks

---

## In-Browser Report Viewer

A React-based quarterly report viewer exists under `src/app/(portal)/partners/components/`. It is **not yet wired up** — `/partners/reports/[slug]/page.js` still renders the old PDF-embed UI.

**Component tree:**
- `ReportDocument.js` — shell with sticky nav, cover hero, and section routing
- `ReportCover.js`, `ReportCoverNote.js`, `ReportTOC.js`
- `ReportFundSummary.js`, `ReportPortfolio.js`, `ReportCompanyUpdates.js`, `ReportCompanyCard.js`
- `ReportFinancials.js`, `ReportPipeline.js`, `ReportMedia.js`, `ReportContact.js`
- `report.module.css` — all styles for the above

**Data source:** `ReportDocument` expects a `reportData` prop shaped by `buildReportData()` from `quarterly-utils.js`. The snapshot action in Studio (`snapshotReportAction.js`) pre-computes this and writes it to `lpQuarterlyReport.snapshotData` (JSON string). To wire up: fetch the report in `page.js`, parse `snapshotData`, pass to `<ReportDocument reportData={parsed} />`.

**Snapshot API:** `POST /api/snapshot-report/[slug]` — internal-only (`@yali.vc` / `@florintree.com` / `pranavkarnad@gmail.com`). Triggered from the Studio action button. Writes `snapshotData` + `snapshotTimestamp` back to Sanity.

---

## PDF Generation

**ALWAYS preview with `?html=1` in the browser — never generate a direct PDF for review.** The HTML web-to-print preview is the source of truth for layout debugging. Only generate the actual PDF (via Puppeteer) as the final delivery step after the HTML preview looks correct.

```bash
curl -s "http://localhost:3000/partners/api/generate-pdf/<slug>/?html=1" \
  -H "Cookie: portal-session=$COOKIE" \
  -o docs/<slug>-report.html && open docs/<slug>-report.html
```

- Route: `/partners/api/generate-pdf/[slug]` — **local-only, never called in production**
- `maxDuration` is set to 60 only to satisfy Vercel Hobby plan build validation — the route is never hit on Vercel
- PDF builder: `src/lib/generateQuarterlyPdf.js` (Puppeteer, HTML-to-PDF)
- Request handler: `src/lib/pdfRequestHandler.js`
- `tagged: true` must be set in `page.pdf()` options — required for clickable link annotations
- Gift City LPs (`portalUser.isGiftCityLP == true`) get an additional `giftCityFundFinancialsPdf` attachment from `lpQuarterlyReport`
- LinkedIn social updates render as a single banner; video updates render as thumbnail cards with play overlay

### Two-pass layout architecture

Variable-content sections (cover note, company pages, media, contact) use a **two-pass approach** to assemble explicit A4 pages:

**Pass 1 — measure:** Each section is a `<div class="pdf-var-section">` hidden off-screen. Its children are `<div class="pdf-block">` elements. The inline IIFE at the bottom of the HTML body measures each block's height via `getBoundingClientRect()` while positioned at `left: -99999px; width: 794px`.

**Pass 2 — pack:** The IIFE creates explicit `.page` divs (each `height: 1123px; overflow: hidden`) using `makePage()`. Blocks are appended greedily until adding the next block would exceed `AVAIL_H`. Then a new page is started. Blocks are `cloneNode(true)`'d so CSS classes and attributes are preserved. The original `pdf-var-section` div is removed from the DOM after all its blocks are placed.

**`AVAIL_H` formula:** `A4_H(1123) − HEADER_H(measured at runtime) − PAD_V×2(56) − PAGE_NUM_ZONE(78) ≈ 901px`

**Critical detail — `max-height`:** Each `.pdf-content-area` gets `max-height: AVAIL_H px; overflow: hidden`. Without this, blocks that are individually taller than AVAIL_H bleed into the page-number/CONFIDENTIAL zone at the bottom even though `.page { overflow: hidden }` clamps the outer page.

**`.pdf-block { overflow: hidden }` — critical BFC rule (do not remove):**

- **Symptom:** content near the bottom of a page is clipped or a section label appears at the bottom with its body missing on the next page. Multiple companies affected systematically, not just one.
- **Root cause:** CSS margin collapse. `.body-text p`, `.body-text ul`, `.body-text ol` all have `margin-bottom: 10px`. A `pdf-block` div has no vertical padding and no border, so those child margins collapse *outward* to the block's bottom edge. `getBoundingClientRect()` returns the **border-box** height, which excludes collapsed-out margins. The IIFE's `cur.used` therefore under-counts the real space each block occupies. When blocks are stacked as siblings inside `.pdf-content-area`, the escaped margins push each subsequent block further down than the IIFE expects — the cumulative drift across 6–9 blocks per company section can exceed 60–90px. This tips the last block past `AVAIL_H`, and `overflow: hidden` on the content-area clips it.
- **Remedy:** `overflow: hidden` on `.pdf-block` establishes a Block Formatting Context (BFC). Inside a BFC, children's margins cannot collapse outward — they are contained within the block's border-box. `getBoundingClientRect()` then returns the true height inclusive of child margins, so measured heights exactly match rendered heights and packing is accurate.
- **Why fonts were a red herring:** the font loading hypothesis (`document.fonts.ready`) was investigated first but did not fix the issue. The `.pdf-block { overflow: hidden }` rule is the actual fix. The `document.fonts.ready` wrapper was added anyway and is harmless (it ensures measurement happens after fonts are loaded, which is correct practice), but it was not the cause of the clipping.

**`data-keep-with-next="true"`:** Add this attribute to any `pdf-block` that must stay on the same page as the block after it (e.g., section headings, the closing paragraph before the signature). The IIFE adds the next block's height to `need` before deciding whether to start a new page.

**`.cn-block` class:** Applied to all cover note `pdf-block` divs. CSS targets `.cn-block .body-text` to bump font from 12px → 14px without affecting company or other sections.

**Static pages** (fund summary, portfolio investments page, separators, fund financials, pipeline) are normal `.page` divs in the HTML and are not processed by the IIFE.

### Page header template

`<div id="tpl-page-header" style="display:none;">` in the body holds the header HTML. The IIFE reads `.innerHTML` from it and stamps a copy into every IIFE-generated page. Static pages call `headerHtml()` directly. The IIFE measures `HEADER_H` by appending a hidden copy of the header to the body and calling `getBoundingClientRect().height`.

### Page numbering

**HTML preview (browser):** At the end of the IIFE, two passes run:
1. Page number badges — fills empty `<span>` elements inside `.page-number` with `'Page N'` using sequential index.
2. TOC spans — fills `[data-toc-page]` spans using `Math.floor(target.getBoundingClientRect().top / A4_H) + 1` — same formula as Puppeteer, measured against the now-final DOM. Both HTML preview and PDF show correct TOC numbers.

**PDF (Puppeteer):** After `page.setContent()`, `page.evaluate()` overwrites all `.page-number span` elements and `[data-toc-page]` spans a second time using the same `getBoundingClientRect().top / 1123` formula. This is redundant with what the IIFE already did but harmless — Puppeteer reruns it to guarantee accuracy against the final Chromium layout.

Page-number zone: `.page-number { position: absolute; right: 28px; bottom: 44px; height: 34px }`. CONFIDENTIAL: `.page::after { position: absolute; bottom: 12px }`. `PAGE_NUM_ZONE = 78` accounts for both.

`data-toc-page` attributes reference section element IDs: `section-cover-note`, `section-fund-summary`, `section-portfolio-inv`, `section-portfolio-updates`, `section-fund-fin`, `section-pipeline`, `section-media`, `section-contact`.

**Critical:** For variable sections (`pdf-var-section`), the anchor `id` must be on the **first `pdf-block` inside the section**, NOT on the `pdf-var-section` div itself. The IIFE removes `pdf-var-section` from the DOM after packing, so any `id` on it becomes unreachable in Puppeteer's `page.evaluate()`. Since `cloneNode(true)` carries all attributes, placing the `id` on the first block ensures it lands in the first `.page` div for that section. Static `.page` divs (fund-summary, portfolio-inv, etc.) can keep their `id` directly on the page div.

### PDF content rules — web portal is source of truth

When in doubt about how something should appear in the PDF, check the web portal first. The PDF must match the portal display exactly for all data. Style differences (fonts, spacing, layout) are acceptable; data differences are not.

**Date formatting**
- `fmtDate()` — used for close dates and initial investment dates. Format: `15 Jul 24` (no apostrophe, no comma).
- `fmtMonthYear()` — used inside round labels in the company snapshot header. Format: `Nov '25` (keeps apostrophe). Do NOT change this one.

**Fund summary page**
- Subtitle below "Fund Summary" heading: `Combined fund size: ₹N crore` (whole number, no decimals if integer). Not "As of [date]".
- Table left-column header: `As of [month year]`. Right-column header: `Amount in ₹ crores`.
- All monetary values in the table body are **bare numbers** (e.g. `893.00`, `216.08`) — no ₹ prefix, no Cr suffix. The column header carries the unit.
- Non-monetary values (dates, counts, multiples) render normally.
- Row label: "Fair Market Value of Portfolio Investments (including **realized** value)" — American spelling, not British.

**Portfolio investments table (page 6)**
- "Fully Diluted Ownership (%)" column: bare number without % sign (e.g. `14.05`, not `14.05%`). The column header carries the unit.
- "Yali investment" column header is intentional and consistent — do not rename it.

**Cover note**
- Section headings used: "Investment Activity", "Portfolio Highlights", "Ecosystem & Tailwinds", "Closing Note".
- "Closing Note" heading must appear as a distinct `pdf-block` immediately before the closing paragraph block. Both get `data-keep-with-next="true"` so they stay together with the signature block.

**Company page KPI block**
Rendered at the top of the "Quarter updates" section, inside a bordered `.kpi-block` div. Fields shown depend on company state:

| Field | When shown | Value |
|---|---|---|
| Multiple | Always (if moic available and not confidential) | `1.00x` |
| Revenue | Revenue-making + not confidential + data available | `₹9.97 Cr` |
| PAT | Same conditions as Revenue | `₹-6.09 Cr` (negative uses `₹-N Cr` format) |
| Financials | Pre-revenue companies (`isRevenueMaking: false`) | `"This company is pre-revenue"` text |
| Team Size | If `teamSize` on current quarterlyUpdate, not confidential | bare integer |

If both `revenueConfidential` and `patConfidential` are true on the current quarter (quiet period), the entire Financials/Revenue/PAT group is **omitted** from the KPI block — don't show `**`, just omit. Team Size still shows if available.

**Quiet-period handling (e.g. Tonbo during IPO process)**
- Set `revenueConfidential: true` and `patConfidential: true` on the company's quarterly update in Sanity.
- In the financials table, the current quarter column is **excluded entirely** when both flags are true — don't show a `**` column, just skip it.
- Previous quarters that are confidential still show `**` in their column.
- The financials footnote automatically appends: `"** Revenue and PAT are kept confidential during the quiet period."` whenever any visible column has `**`.
- This is toggled via Sanity Studio: Company → Quarterly Updates → [quarter] → Revenue Confidential / PAT Confidential checkboxes.

**British spellings**
- All hardcoded labels in `generateQuarterlyPdf.js` must use American English: "realized", "modernize", "specializes", etc.
- For content stored in Sanity (company `detail` field, `updateNotes`, etc.), fix British spellings via the Sanity write API or Studio directly. The `detail` field is a plain string — patch with a mutation. Check before assuming all Sanity content is clean.

### Div-based table rows (round details + financials)

Company round detail and financial tables use `.rd-row` / `.rd-cell` flex divs instead of `<table>` elements. Wrapped in `<div class="pdf-block" style="padding: 0 40px 12px;">`. First column: `width: 34%`. Remaining columns: `flex: 1`.

**Why divs, not `<table>`:** Chrome's print engine treats `<tr>` as atomic — a row that doesn't fit gets pushed to the next page, creating blank gaps. Div rows break freely at any boundary, matching how company narrative text behaves.

### Debug mode

`?debug=1` on the generate-pdf route renders only cover + TOC + cover note (skips all company pages, financials, media, contact). Fast way to test cover note layout without waiting for the full report.

```bash
curl "http://localhost:3000/partners/api/generate-pdf/q1-fy27-quarterly-report/?html=1&debug=1" ...
```

### Turbopack caching gotcha

Changes to `src/lib/generateQuarterlyPdf.js` or `src/lib/pdfRequestHandler.js` are often NOT picked up by a running dev server even after file saves. Turbopack's module cache persists stale compiled versions. **Always kill the server and wipe `.next/` before testing changes to these files:**

```bash
pkill -f "next dev"
rm -rf .next
npm run dev
```
