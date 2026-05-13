# yali-site — Agent Context

## Stack
- Next.js 16.2.2, App Router, Turbopack, `trailingSlash: true` in `next.config.js`
- Sanity CMS: projectId `nt0wmty3`, dataset `production`, apiVersion `2024-01-01`
- Deployed on **Vercel Hobby plan** (free tier — see constraints below)
- Node.js crypto for auth, Resend for email, PDFKit for PDF generation

---

## Domain & Routing

| Domain | Maps to | Notes |
|---|---|---|
| `yali.vc` | `/` | Main marketing site |
| `partners.yali.vc` | `/partners/*` | LP portal |
| `dataroom.yali.vc` | `/dataroom/*` | Investor data room |

- All three domains map to a **single Next.js app**
- `src/proxy.js` is the middleware file — **not** `middleware.js` or `src/middleware.js`
- `proxy.js` handles subdomain rewrites AND HMAC session verification (Web Crypto API, Edge Runtime)
- On localhost: all routes accessible at `localhost:3000/partners/...` and `localhost:3000/dataroom/...`
- **All redirects must use relative paths.** Never hardcode `https://partners.yali.vc/` etc.

---

## Auth Systems

Both systems share the same session format and secret.

**Session cookie format:** `email:timestamp:hmac-sha256-hex`
**Secret:** `process.env.PORTAL_AUTH_SECRET` (used for both portal and dataroom)

### Portal (`portal-session` cookie)
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

### Dataroom (`dataroom-session` cookie)
- OTP flow via `/api/dataroom-auth/route.js`
- Same `session.js` verifier
- Trusted domains: `@yali.vc`, `@florintree.com`
- Non-trusted access: `portalUser.investorDataRoomAccess == true` OR active `domainPrivilege` Sanity doc
- `domainPrivilege` modes: `requireCode: true` (shared invite code) or `requireCode: false` (open for domain)
- Kill switch: `noAccess: true` blocks even trusted domains and domain privilege users
- Portfolio `/dataroom/portfolio` category requires a `portalUser` record — domain privilege alone is not enough

### `src/lib/session.js`
Shared HMAC verifier. Returns `email` string if valid, `null` if invalid/tampered/missing.

---

## Key Non-Obvious Files

| File | Purpose |
|---|---|
| `src/proxy.js` | Next.js middleware (subdomain rewrite + session verification) |
| `src/lib/session.js` | HMAC session verifier for server components |
| `src/lib/quarterly-utils.js` | All quarterly period logic for LP portal |
| `src/lib/pdfRequestHandler.js` | LP quarterly report PDF request handler |
| `src/lib/generateQuarterlyPdf.js` | PDF builder (PDFKit) |
| `src/lib/sanity-queries.js` | All Sanity GROQ queries — check here before writing new queries |

---

## LP Portal

- Indian fiscal year quarters: Q1=Apr–Jun, Q2=Jul–Sep, Q3=Oct–Dec, Q4=Jan–Mar
- Fiscal year label: "FY26" = April 2025 – March 2026
- Company detail pages show investment rounds filtered to the **current quarter only** — use `filterInvestmentRounds(rounds, quarterEndDate, nextQuarterEndDate)` from `quarterly-utils.js`
- FMV/metrics fallback: only use past quarters, never future — use `getMostRecentPastQuarterData()` not `latestQuarter` or `quarterlyUpdates[0]`
- Internal reports (`visibility: 'internal'`) are restricted to `@yali.vc` only
- PDF generation route: `/partners/api/generate-pdf/[slug]` — **local-only, never called in production**. `maxDuration` is set to 60 to satisfy Hobby plan build validation but the route is never hit on Vercel.
- The public `/api/generate-pdf/[slug]` route exists for dataroom use; same local-only rule applies

---

## Data Room

- Full auth gate on both `/dataroom` (landing) and `/dataroom/[category]`
- Categories: `fund-i`, `fund-ii`, `team`, `track-record`, recommendations
- Documents managed via `fundContent` Sanity document
- Latest LP report shown under Fund I section (fetched via `getLatestLPReportForDataRoom`)

---

## Sanity

- Read client: `useCdn: false` for all authenticated/dynamic pages
- Write client: requires `process.env.SANITY_WRITE_TOKEN` — only used in auth routes (OTP write-back, invite code redemption)
- `getAllBlogPosts()` returns `{ posts: [...], total: n }` — **not a plain array**. Always destructure: `const { posts = [] } = await getAllBlogPosts()`
- Key schema types: `portalUser`, `domainPrivilege`, `investorRelations`, `fundContent`, `lpFundSettings`, `quarterlyReport`, `blogPost`, `teamMember`, `company`

---

## Design System

| Token | Value |
|---|---|
| Dark | `#363636` |
| Crimson | `#830d35` |
| Light bg | `#efefef` |
| Mid gray | `#d0d0d0` |
| Yellow accent | `#ebde84` |
| Heading font | JetBrains Mono |
| Body font | Inter |
| Border weight | `1px solid #363636` |

**Full-width horizontal divider pattern:**
```css
border-top: 1px solid #363636;
width: 100vw;
position: relative;
left: 50%;
transform: translateX(-50%);
margin: 0;
```

Section labels: JetBrains Mono, 10px, `font-weight: 700`, `letter-spacing: 0.18em`, uppercase, color `#830d35`.

---

## Vercel Hobby Plan Constraints

All code must work within these hard limits:

| Constraint | Limit |
|---|---|
| `maxDuration` (serverless functions) | **60s maximum** — will fail build if exceeded |
| Default function timeout | 10s |
| Function invocations | 1,000,000/month |
| Build execution minutes | 6,000/month |
| Deployments per day | 100 |
| Runtime logs retention | 1 hour, 4,000 rows |
| Domains per project | 50 |

- Do not set `maxDuration > 60` on any route
- Do not introduce long-running server-side operations in routes that run in production
- PDF generation is exempt because it only runs locally

---

## Git Workflow

**Always push to both `staging` and `main` after every commit.**

```bash
git push origin staging
git checkout main && git pull origin main && git merge staging --no-edit && git push origin main
git checkout staging
```

- Working branch: `staging`
- Main branch: `main` (receives merges from staging)
- GitHub remote: `jakradum/yalivc`

---

## Local-Only: /docs Document Generator

`docs/` folder at repo root — **not served by Next.js, not part of the build**.

Used to generate designed PDF documents: open HTML file in Chrome → Print → Save as PDF.

| File | Document |
|---|---|
| `docs/complaint-handling-policy.html` | Complaint Handling & Grievance Redressal Policy |
| `docs/trend-of-annual-disposal-of-complaints.html` | Trend of Annual Disposal of Complaints |

Rules for all docs files:
- Fonts referenced via `../public/fonts/` (relative path, works with `file://`)
- Logo: `../public/yali-logo.png`
- **Always include `print-color-adjust: exact` on the `*` selector** — without it, background colours are stripped on print
- `@page { size: A4; margin: 0; }` in print CSS
- Screen view: pages rendered as white cards on `#d0d0d0` background with a "Print / Save as PDF" button

---

## Never Do

- Import `redirect` from `next/headers` — it's in `next/navigation`
- Hardcode absolute subdomain URLs in redirects — use relative paths
- Set `maxDuration > 60` on any API route
- Call `.filter()` directly on `getAllBlogPosts()` return value — it returns `{ posts, total }`, not an array
- Use `inv.latestQuarter` or `quarterlyUpdates[0]` as FMV fallback — these can be future quarters
- Add `generateStaticParams` to pages that require runtime auth checks
- Push to only one branch — always push to both `staging` and `main`
