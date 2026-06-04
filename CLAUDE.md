# yali-site — Agent Context

> **This file is written for AI coding agents, not humans.** It documents non-obvious conventions, gotchas, and architectural decisions that cannot be derived by reading the code. Do not rewrite it in a human-friendly style.

## Stack
- Next.js 16.2.2, App Router, Turbopack, `trailingSlash: true` in `next.config.js`
- Sanity CMS: projectId `nt0wmty3`, dataset `production`, apiVersion `2024-01-01`
- Sanity Studio embedded at `/console` (not `/studio`) — accessible at `yali.vc/console`
- Deployed on **Vercel Hobby plan** (free tier — see constraints below)
- Node.js crypto for auth, Resend for email, Puppeteer for PDF generation (HTML-to-PDF)

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

## Page Structure

### Main site (`yali.vc`)
| Route | File |
|---|---|
| `/` | `src/app/page.js` |
| `/about-yali` | `src/app/about-yali/page.js` |
| `/about-yali/[slug]` | `src/app/about-yali/[slug]/page.js` |
| `/investments` | `src/app/investments/page.js` |
| `/investments/[slug]` | `src/app/investments/[slug]/page.js` |
| `/investments/[slug]/[companySlug]` | `src/app/investments/[slug]/[companySlug]/page.js` |
| `/blog` | `src/app/blog/page.js` |
| `/blog/[slug]` | `src/app/blog/[slug]/page.js` |
| `/newsroom` | `src/app/newsroom/page.js` |
| `/newsroom/press-downloads` | `src/app/newsroom/press-downloads/page.js` |
| `/newsletter` | `src/app/newsletter/page.js` |
| `/newsletter/[slug]` | `src/app/newsletter/[slug]/page.js` |
| `/investor-relations` | `src/app/investor-relations/page.js` |
| `/contact` | `src/app/contact/page.js` |
| `/disclosures` | `src/app/disclosures/page.js` |
| `/unsubscribe` | `src/app/unsubscribe/page.js` |
| `/console/[[...tool]]` | `src/app/console/[[...tool]]/page.js` (Sanity Studio) |

### LP Portal (`partners.yali.vc`)
| Route | File |
|---|---|
| `/partners` | `src/app/(portal)/partners/page.js` |
| `/partners/sign-in` | `src/app/(portal)/partners/sign-in/page.js` |
| `/partners/company/[slug]` | `src/app/(portal)/partners/company/[slug]/page.js` |
| `/partners/reports/[slug]` | `src/app/(portal)/partners/reports/[slug]/page.js` |

### Data Room (`dataroom.yali.vc`)
| Route | File |
|---|---|
| `/dataroom` | `src/app/(dataroom)/dataroom/page.js` |
| `/dataroom/sign-in` | `src/app/(dataroom)/dataroom/sign-in/page.js` |
| `/dataroom/[category]` | `src/app/(dataroom)/dataroom/[category]/page.js` |

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
| `src/lib/generateQuarterlyPdf.js` | Quarterly PDF HTML builder (rendered by Puppeteer) |
| `src/lib/sanity-queries.js` | All Sanity GROQ queries — check here before writing new queries |

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `PORTAL_AUTH_SECRET` | `session.js`, `proxy.js`, auth routes | HMAC secret for session cookies (both portal and dataroom) |
| `SANITY_WRITE_TOKEN` | Auth routes only | Write back OTP codes, invite code redemptions |
| `RESEND_API_KEY` | `/api/send-newsletter*` | Email delivery via Resend |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity client | Project ID (also hardcoded: `nt0wmty3`) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity client | Dataset (also hardcoded: `production`) |

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

## Disclosures Page (`/disclosures`)

- Static page, no Sanity, no auth — `src/app/disclosures/page.js` + `disclosures.module.css`
- Content: SEBI registration details, investor grievances contact, complaint handling policy PDF link
- The registration details block is a flex-based list (`.detailList` / `.detailRow`), not an HTML `<table>`
- PDF linked at `/complaint-handling-policy.pdf` — served from `public/`; the source HTML is `docs/complaint-handling-policy.html`
- **CSS gotcha:** `.content` has `width: 100%` + horizontal padding. It must have `box-sizing: border-box` or the padding adds to the width and overflows on mobile. This has already been fixed — don't remove it.
- Mobile breakpoint: 640px. Below this, `.detailRow` switches to `flex-direction: column` so label and value stack vertically.

---

## Sanity

- Read client: `useCdn: false` for all authenticated/dynamic pages
- Write client: requires `process.env.SANITY_WRITE_TOKEN` — only used in auth routes (OTP write-back, invite code redemption)
- `getAllBlogPosts()` returns `{ posts: [...], total: n }` — **not a plain array**. Always destructure: `const { posts = [] } = await getAllBlogPosts()`
- Key schema types: `portalUser`, `domainPrivilege`, `investorRelations`, `fundContent`, `lpFundSettings`, `quarterlyReport`, `lpQuarterlyReport`, `blogPost`, `teamMember`, `company`, `news`, `investor`
- **Two schema registries exist:** `src/sanity/schemas/index.js` (used by the Next.js app) and `src/sanity/schemaTypes.js` (used by the Sanity Studio config). Both must be kept in sync when adding/removing schema types.

### `portalUser` schema fields
| Field | Type | Notes |
|---|---|---|
| `email` | string | Required. Primary identifier. |
| `name` | string | LP name or organisation |
| `lpPortalAccess` | boolean | Grants LP portal access. Default true. |
| `investorDataRoomAccess` | boolean | Grants data room access. Independent of portal. Default false. |
| `noAccess` | boolean | Kill switch. Overrides all other access flags. Default false. |
| `isGiftCityLP` | boolean | Shows GIFT City-specific fund financials PDF in quarterly report. Default false. |
| `source` | string | `portal` or `dataroom` — how the user was onboarded. |
| `inviteActions` | custom UI | InviteButtons component — send portal/dataroom invites from Studio. Read-only. |
| `inviteCode` | string | Hidden. Managed by invite API. |
| `inviteCodeExpiry` | string | Hidden. Managed by invite API. |

### `investor` schema fields
| Field | Type | Notes |
|---|---|---|
| `name` | string | Required. Display name (e.g., "Sequoia Capital") |
| `slug` | slug | Auto-generated from name |
| `type` | string | vc / angel / family-office / corporate / government / other |
| `website` | url | Optional |
| `logo` | image | Upload via Studio. Used in co-investor display and deck slides. |

LP investor logos: upload via Studio → Investors → set category to LP. When pulling logos for deck slides, query `investor` docs by name and construct Sanity CDN URL from the `logo.asset._ref`.

**Sanity CDN URL format:** `https://cdn.sanity.io/images/nt0wmty3/production/{hash}-{width}x{height}.{ext}`
where the asset `_ref` is `image-{hash}-{width}x{height}-{ext}`.

### `company` schema — key fields
| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name (main website) |
| `entityName` | string | Legal name for LP reports; falls back to `name` if blank |
| `slug` | slug | Required |
| `oneLiner` | string | Required |
| `showOnMainWebsite` | boolean | Toggle off to hide from public site while keeping in LP reports |
| `enableCompanyPage` | boolean | Controls whether company card is clickable |
| `isFeatured` | boolean | Pins as featured card on homepage. Only one at a time. |
| `isRevenueMaking` | boolean | Controls whether revenue/PAT fields are editable in quarterly updates |
| `investmentRounds` | array | All rounds (see below) |
| `quarterlyUpdates` | array | Per-quarter FMV, revenue, PAT, metrics, narrative |
| `investmentStatus` | string | active / exited / written-off |
| `founders` | array | name, photo, role, quote, LinkedIn |

**`investmentRounds` per-round fields:** `isInitialRound`, `isYaliLead`, `showEarlyInReport`, `roundName`, `roundLabel`, `investmentDate`, `preMoneyValuation`, `totalRoundSize`, `postMoneyValuation`, `yaliInvestment`, `yaliOwnership`, `coInvestors` (array of `investor` refs, optionally with `displayOrder`)

**`quarterlyUpdates` per-quarter fields:** `quarter`, `fiscalYear`, `currentFMV`, `currentOwnershipPercent`, `amountReturned`, `multipleOfInvestment`, `revenueINR`, `patINR`, `teamSize`, `keyMetrics` (custom label/value pairs), `tableFootnotes`, `updateNotes` (portable text)

**Non-obvious schema fields:**
- `portalUser.isGiftCityLP` (boolean) — controls whether `giftCityFundFinancialsPdf` is shown in the quarterly PDF
- `lpFundSettings.rvpi` — RVPI metric; fund metrics section only renders in the portal/PDF when values are actually populated (don't assume it's always present)
- `lpQuarterlyReport.giftCityFundFinancialsPdf` — separate financials PDF for Gift City LPs; rendered only when `portalUser.isGiftCityLP` is true
- `lpQuarterlyReport.mediaNotes` — portable text array (not a string); each item has optional `link.href`. Use `renderMediaNotesBlocks()` in `generateQuarterlyPdf.js`
- `company` co-investors: each round's `coInvestors` array item has optional `displayOrder` (integer) for controlling render order
- `news.isVideo` (boolean) + `news.videoSource` (string URL) — for video news items; `videoSource` accepts YouTube URLs. Always check `isVideo` before treating as article link
- `investor.logo` (image) — logo for co-investor display and deck slides; upload via Studio → Investors

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

### Style rules (apply everywhere — site, docs, emails)
- **No em dashes (`—`) in any user-facing text.** Use `:`, `,`, or `;` instead. The only permitted use is as a data placeholder value (e.g. FMV not yet available shown as `—`).
- **All boxes/cards/containers: `border: 1px solid #363636`, no `border-radius`.** This includes cards, tiles, logo boxes, input boxes, and any visible container element.
- **All separator lines: `border-top: 1px solid #363636`** (or `border-bottom`). Do not use lighter grays (#d8d4cf, #e0e0e0, #ece8e4, etc.) for separators.
- Exception: elements on crimson backgrounds may use gold (`rgba(235,222,132,0.45)`) borders. SVG spoke/connector lines in diagrams may remain `#c0bcb8`. Video tiles may use their dark border.

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
- **`docs/` is in `.gitignore`** — all pitch decks, letters, and generated documents are local-only and will never appear in git. Do not try to commit them.

---

## Local-Only: /docs Document Generator

`docs/` folder at repo root — **not served by Next.js, not part of the build, not tracked in git**.

Used to generate designed PDF documents: open HTML file in Chrome → Print → Save as PDF.

| File | Document |
|---|---|
| `docs/complaint-handling-policy.html` | Complaint Handling & Grievance Redressal Policy |
| `docs/trend-of-annual-disposal-of-complaints.html` | Trend of Annual Disposal of Complaints |
| `docs/financials-yali-deeptech-i.html` | Yali Deeptech I — Financial Statements FY25–26 (USD, 2 pages) |
| `docs/financials-yali-deeptech-fund-i.html` | Yali Deeptech Fund I — Financial Statements FY25–26 (INR, 3 pages) |
| `docs/virtual-backgrounds.html` | Teams virtual backgrounds (1920×1080, 11 designs) |
| `docs/letterhead-template.html` | Yali Partners LLP letterhead — blank template for future letters |
| `docs/employment-confirmation-pranav.html` | Employment confirmation letter for Pranav Karnad (INSEAD GEMBA, Aug 2026–Jan 2028) |
| `docs/podcast-subroto-bagchi.html` | Podcast questions document (12 questions, 7 themes, 4 pages) |
| `docs/fund2-deck.html` | Fund II investor pitch deck (960×540px, Chrome → Print → Save as PDF) |
| `docs/fund1-deck.html` | Fund I investor pitch deck (same format) |
| `docs/sri-fund-portfolio.html` | Yali Capital × SRI Fund portfolio overview (A4) |
| `docs/linkedin-carousel-may-2026.html` | LinkedIn team roundup carousel — May 2026 (1080×1080px, 5 slides) |

Rules for all docs files:
- Fonts referenced via `../public/fonts/` (relative path, works with `file://`)
- Logo: `../public/yali-logo.png`
- **Always include `print-color-adjust: exact` on the `*` selector** — without it, background colours are stripped on print
- `@page { size: A4; margin: 0; }` in print CSS
- Screen view: pages rendered as white cards on `#d0d0d0` background with a "Print / Save as PDF" button
- **No em dashes (`—`) in any visible text** — use `:`, `,`, or `;` instead. The only permitted use is as a data placeholder value (e.g. FMV not yet available).
- **All borders: `1px solid #363636`, no border-radius** on any box, card, or container.

**Letterhead pattern** (`letterhead-template.html`):
- Background: `#faf8f5` (warm off-white)
- Logo top-left at 96px, date metadata top-right in JetBrains Mono bold
- Thin warm divider (`1px solid #c8c0b4`) below header and above footer
- Flexbox page layout: header + `<hr>` + `.page-content { flex:1 }` + `<hr>` + footer
- Footer: `yali.vc` left, registered address right
- Signatory block has 80px space above for physical signature
- "Yali Partners LLP" appears only in the signatory block, not the header
- For new letters: duplicate `letterhead-template.html`, fill in date/subject/body/signatory

**Virtual backgrounds pattern** (`virtual-backgrounds.html`):
- Each background is 1920×1080 inside a `.bg-wrap` (960×540) using `transform: scale(0.5); transform-origin: top left`
- To export: Chrome DevTools → select `.bg` element → right-click → "Capture node screenshot" → saves at 1920×1080 (3840×2160 on Retina)
- Logo uses `filter: brightness(20)` for white-on-dark variants; `outline: 1.5px dashed rgba(255,255,255,0.32); outline-offset: 14px` for dotted outline effect

**Fund II deck** (`docs/fund2-deck.html`):
- Slide canvas: 960×540px (landscape). `@page { size: 960px 540px; margin: 0; }` — NOT A4
- Slide order: Cover, Contents, Team (divider + 4 slides), Thesis (divider + 3 slides), Process (divider + 2 slides), Fund I (divider + multiple slides including LP logos + CXO map), Fund II (slides), Media & Recognition, Thank You
- Hub-and-spoke (investment areas slide): sector boxes are `fill:#efefef stroke:#363636 stroke-width:1`, icons are Lucide stroke icons at `stroke-width:1` (not 1.5), `stroke:#363636`, sized 38×38 centred in 100×100 box at `(box_x+31, box_y+31)`; hub is crimson 80×80 with white `favicon.svg` logomark at 52×52 centred `(414,189)` — use `filter: brightness(0) invert(1)` to make it white; spokes use solid diagonals and dotted horizontals in `#c0bcb8`
- Icons were supplied as 3 SVG files (2 icons per file, 2700×4800 canvas). Mapping: Smart Mfg=File2(1) bottom, Fabless Semi=File3 bottom (chip+pins), Life Sci=File1(2) top, Robotics=File2(1) top, AI=File1(2) bottom, Aerospace=File3 top
- SVG `<pattern>` elements render pixellated in Chrome PDF — always replace with explicit JS-rendered `<line>` elements (see existing plus-grid renderers in the script section)
- Plus-grid renderers: `hex-team-sep`, `hex-thesis`, `plusgrid-fi-div`, `plusgrid-process-sep` — all use same loop pattern, fill `#ebde84`, opacity 0.55
- World map (CXO slide): D3 v7 + TopoJSON, Natural Earth projection scale 155, target countries India/USA/Taiwan/Korea/Singapore highlighted dark, others `#d4d0cc`. Country labels show name only (no subtitle).
- LP logos slide: 5 investor logos pulled from Sanity `investor` docs by name. Current logos: Infosys, SRI, SIDBI, Tata AIG, Qualcomm. Images served via Sanity CDN with `?w=280&fit=max&auto=format`.
- Cover slide has an auto-generated "last updated" date (`#cover-date`) rendered via JS at load time in `"D Mon YYYY"` format (e.g. "4 Jun 2026"). Do not hardcode a date here.
- Image assets (logos, team photos): use `investor.logo` from the `investor` Sanity schema. Upload via Studio → Investors.

**LinkedIn carousel template** (`docs/linkedin-carousel-may-2026.html`):
- This is the canonical template for all future monthly LinkedIn team roundup carousels
- Page size: `@page { size: 1080px 1080px; margin: 0; }` — square LinkedIn format, not A4
- Slide structure: 5 slides — (1) collage cover, (2-4) update slides, (5) closing
- Cover slide: blurred photo collage as background (`filter: blur(6px) brightness(0.35)`), "Roundup [Month] '[YY]" title overlaid in JetBrains Mono
- Update slides alternate dark (#363636) and light (#efefef) backgrounds
- All fonts are JetBrains Mono — no Inter in this template
- Logo: `../public/yali-logo.png` displayed as image only (logo already contains "Yali Capital" text) — do not add a text span alongside it
- Image colour correction via CSS: `filter: brightness(1.08) contrast(1.12) saturate(0.55)` on photo imgs only (not logos)
- To create a new monthly carousel: duplicate this file, rename to `linkedin-carousel-[month]-[year].html`, replace images and copy, update the cover title
- Images go in `docs/` alongside the HTML; filenames with spaces must be URL-encoded in src attributes (`%20`)
- `object-position` controls image crop/pan; `transform: scale(N)` on the img element zooms within the container (container has `overflow: hidden`)

**Quarterly PDF notes:**
- `tagged: true` must be set in `page.pdf()` options — required for clickable link annotations in the output PDF
- LinkedIn social updates render as a single banner; video updates render as thumbnail cards with play overlay

---

## Newsletter System

The newsletter system is fully built and live in production. It uses Sanity as the CMS and Resend for delivery. Studio is embedded in the Next.js app at `/console` (not `/studio`). All send actions call relative API URLs, so they hit the production Vercel deployment — no local server needed to trigger sends.

---

### Sanity document types

**`newsletter`** — one doc per edition. Key fields:
- `_id` — needed to trigger sends programmatically
- `title`, `edition` (integer), `slug.current`, `publishedDate`, `status` (`draft` | `published` | `archived`)
- `shortDescription` — shown in email header below title (150-250 chars, required)
- `author` — reference to `teamMember`; name + photo appear in the crimson header block
- `podcastUrl` — YouTube or Spotify URL; if YouTube, renders a thumbnail card in the email; if other URL, renders a text link
- `sections` — ordered array of typed section objects (see section types below)

**`newsletterSubscriber`** — one doc per subscriber. Key fields:
- `email` — the address (string, required)
- `beta` (boolean) — if `true`, included in beta sends; if `false` or `null`, excluded from beta sends but included in full sends
- `unsubscribed` (boolean) — if `true`, excluded from all sends
- `source` — `homepage-footer` or `import`

---

### Known document IDs (production)

| Edition | Title | `_id` | Status |
|---|---|---|---|
| 1 | What I learned talking to two people solving cancer with data | `x58ALaHvdl3kThgcWahexf` | published |

---

### Known beta subscribers (as of May 2026)

Beta subscribers receive test sends before the full list. Currently 2:
- `pranav@yali.vc` — `beta: true`
- `kram@yali.vc` — `beta: true`

`pranavkarnad@gmail.com` is on the full list but `beta: false` — it does NOT receive beta sends. To add it to beta, update the `newsletterSubscriber` doc in Sanity Studio.

Full list has ~47 subscribers total. The Yali team are all on it (`beta: false`): `kram@yali.vc`, `sunil@yali.vc`, `gani@yali.vc`, `karthik@yali.vc`, `sandipan@yali.vc`, `jakradum@gmail.com`.

---

### Send paths

**Beta test send:**
- API route: `POST /api/send-newsletter-beta/`
- Body: `{ "newsletterId": "<_id>" }`
- Subscriber filter: `beta == true && unsubscribed != true`
- Reads newsletter with `perspective: 'previewDrafts'` — works on draft docs, no need to publish first
- Triggered from Sanity Studio via the "Send Beta Test" action button on a `newsletter` doc

**Full list send:**
- API route: `POST /api/send-newsletter/`
- Body: `{ "newsletterId": "<_id>" }`
- Subscriber filter: `unsubscribed != true` (includes `null`) — this catches everyone not explicitly unsubscribed
- Also reads with `previewDrafts`
- Triggered from Studio via "Send to Full List" action button — double-click required (first click shows a caution confirmation)

Both routes batch-send in groups of 100 via `resend.batch.send()`. `RESEND_API_KEY` env var must be set (it is, on Vercel).

---

### Triggering a send without Studio UI

To trigger programmatically (e.g. via curl from local or a script):

```bash
# Beta test — replace ID with the newsletter _id
curl -X POST https://yali.vc/api/send-newsletter-beta/ \
  -H "Content-Type: application/json" \
  -d '{"newsletterId":"x58ALaHvdl3kThgcWahexf"}'

# Full list
curl -X POST https://yali.vc/api/send-newsletter/ \
  -H "Content-Type: application/json" \
  -d '{"newsletterId":"x58ALaHvdl3kThgcWahexf"}'
```

Both routes return `{ success: true, sent: N, recipients: [...] }` on success, or `{ error: "..." }` on failure.

---

### Email template

Built in `src/lib/newsletter-email.js` — inline HTML, email-client safe. Key characteristics:
- `from`: `Yali Capital Newsletter <newsletter@yali.vc>`
- `subject`: `Yali Capital Newsletter #N — {title}`
- Crimson (`#830d35`) header block with title in gold (`#ebde84`) and short description
- Each `section` in the doc is rendered by `renderSection()` — section type determines layout
- Unsubscribe link is base64-encoded email token: `https://yali.vc/unsubscribe?token=<base64(email)>`
- List-Unsubscribe header set for one-click unsubscribe compliance
- Subscribe URL constant: `https://yali.vc/newsletter/`
- Web view link: `https://yali.vc/newsletter/{slug.current}`

---

### Section types and their rendered output

| `_type` | Email output | Key fields |
|---|---|---|
| `openingNote` | Body text + author byline (no bold label) | `body` (portable text), `author` (ref) |
| `essay` | Bold label from `title`, body, optional author byline | `title`, `body`, `author` (optional ref) |
| `portfolioSpotlight` | Label: "PORTFOLIO · {company.name}", body | `company` (ref), `body`, `sectionTitle` (override) |
| `guestColumn` | Label, guest name + title/company meta, body | `guestName`, `guestTitle`, `guestCompany`, `body` |
| `radar` | Label + list of items: technology name + contributor + one-liner | `items[]` with `technology`, `oneLiner`, `contributor` (ref) |
| `reading` | Label + list of links with blurbs | `items[]` with `title`, `url`, `blurb` |
| `freeform` | Bold label from `title`, body | `title`, `body` |

All section labels render as uppercase crimson Courier New 18px. Portable text supports: `h2`, `h3`, `blockquote`, `normal` (p), `bullet`/`number` lists, `strong`, `em`, `code`, external links (via `markDef` with `href`).

---

### Creating a new newsletter edition (agent instructions)

1. In Sanity Studio at `yali.vc/console`, create a new `newsletter` document
2. Required: `title`, `slug`, `edition` (next integer after latest), `publishedDate`, `shortDescription`, at least one `section`
3. Set `status` to `draft` — beta sends work on drafts
4. Note the document `_id` after saving (visible in Studio URL or via GROQ query)
5. Use "Send Beta Test" to validate rendering before touching the full list
6. Change `status` to `published`, then use "Send to Full List"

To query all newsletters: `*[_type == "newsletter"] | order(edition desc) { _id, title, edition, status, "slug": slug.current }`

To query subscribers: `*[_type == "newsletterSubscriber"] { email, beta, unsubscribed }`

---

## Never Do

- Use em dashes (`—`) anywhere in user-facing text content — use `:` or `;` instead
- Add `border-radius` to any box, card, tile, or container
- Use non-`#363636` colors for box borders or separator lines (except on crimson backgrounds)
- Import `redirect` from `next/headers` — it's in `next/navigation`
- Hardcode absolute subdomain URLs in redirects — use relative paths
- Set `maxDuration > 60` on any API route
- Call `.filter()` directly on `getAllBlogPosts()` return value — it returns `{ posts, total }`, not an array
- Use `inv.latestQuarter` or `quarterlyUpdates[0]` as FMV fallback — these can be future quarters
- Add `generateStaticParams` to pages that require runtime auth checks
- Push to only one branch — always push to both `staging` and `main`
- Try to commit anything in `docs/` — it's gitignored and local-only
