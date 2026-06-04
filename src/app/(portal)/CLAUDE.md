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

## PDF Generation

- Route: `/partners/api/generate-pdf/[slug]` — **local-only, never called in production**
- `maxDuration` is set to 60 only to satisfy Vercel Hobby plan build validation — the route is never hit on Vercel
- PDF builder: `src/lib/generateQuarterlyPdf.js` (Puppeteer, HTML-to-PDF)
- Request handler: `src/lib/pdfRequestHandler.js`
- `tagged: true` must be set in `page.pdf()` options — required for clickable link annotations
- Gift City LPs (`portalUser.isGiftCityLP == true`) get an additional `giftCityFundFinancialsPdf` attachment from `lpQuarterlyReport`
- LinkedIn social updates render as a single banner; video updates render as thumbnail cards with play overlay
