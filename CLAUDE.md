# yali-site — Agent Context

> **This file is written for AI coding agents, not humans.** It documents non-obvious conventions, gotchas, and architectural decisions that cannot be derived by reading the code. Do not rewrite it in a human-friendly style.

## Subdirectory context files

Additional CLAUDE.md files are loaded automatically when you touch files in those directories:

| Directory | File | When loaded |
|---|---|---|
| `src/app/(portal)/` | LP portal auth, quarterly logic, PDF generation | Touching any portal page or component |
| `src/app/(dataroom)/` | Dataroom auth, categories, domainPrivilege | Touching any dataroom page or component |
| `src/sanity/` | Schema field tables, two-registry rule, CDN URL format | Touching schemas, queries, Studio config |
| `docs/` | Docs generator rules, per-file details, deck-specific notes | Touching any HTML doc in docs/ |

---

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

Both portal and dataroom share the same session format and secret.

**Session cookie format:** `email:timestamp:hmac-sha256-hex`
**Secret:** `process.env.PORTAL_AUTH_SECRET`
**Verifier:** `src/lib/session.js` — returns `email` string if valid, `null` if invalid/tampered/missing

- Portal uses `portal-session` cookie; dataroom uses `dataroom-session` cookie
- `redirect` must be imported from `next/navigation`, NOT `next/headers`
- For full auth implementation details, see the subdirectory CLAUDE.md files

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

## Disclosures Page (`/disclosures`)

- Static page, no Sanity, no auth — `src/app/disclosures/page.js` + `disclosures.module.css`
- Content: SEBI registration details, investor grievances contact, complaint handling policy PDF link
- The registration details block is a flex-based list (`.detailList` / `.detailRow`), not an HTML `<table>`
- PDF linked at `/complaint-handling-policy.pdf` — served from `public/`; source HTML is `docs/complaint-handling-policy.html`
- **CSS gotcha:** `.content` has `width: 100%` + horizontal padding. It must have `box-sizing: border-box` or padding adds to width and overflows on mobile. Already fixed — don't remove it.
- Mobile breakpoint: 640px. Below this, `.detailRow` switches to `flex-direction: column`.

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

## Newsletter System

The newsletter system is fully built and live in production. It uses Sanity as the CMS and Resend for delivery. Studio is embedded in the Next.js app at `/console` (not `/studio`). All send actions call relative API URLs, so they hit the production Vercel deployment — no local server needed to trigger sends.

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

### Known document IDs (production)

| Edition | Title | `_id` | Status |
|---|---|---|---|
| 1 | What I learned talking to two people solving cancer with data | `x58ALaHvdl3kThgcWahexf` | published |

### Known beta subscribers (as of May 2026)

Beta subscribers receive test sends before the full list. Currently 2:
- `pranav@yali.vc` — `beta: true`
- `kram@yali.vc` — `beta: true`

`pranavkarnad@gmail.com` is on the full list but `beta: false` — it does NOT receive beta sends.

Full list has ~47 subscribers total. The Yali team are all on it (`beta: false`): `kram@yali.vc`, `sunil@yali.vc`, `gani@yali.vc`, `karthik@yali.vc`, `sandipan@yali.vc`, `jakradum@gmail.com`.

### Send paths

**Beta test send:** `POST /api/send-newsletter-beta/` with `{ "newsletterId": "<_id>" }`
- Subscriber filter: `beta == true && unsubscribed != true`
- Reads with `perspective: 'previewDrafts'` — works on draft docs

**Full list send:** `POST /api/send-newsletter/` with `{ "newsletterId": "<_id>" }`
- Subscriber filter: `unsubscribed != true` (includes `null`)
- Triggered from Studio via "Send to Full List" — double-click required (first click shows confirmation)

Both routes batch-send in groups of 100 via `resend.batch.send()`.

### Email template (`src/lib/newsletter-email.js`)

- `from`: `Yali Capital Newsletter <newsletter@yali.vc>`
- `subject`: `Yali Capital Newsletter #N — {title}`
- Crimson header block with title in gold and short description
- Unsubscribe link: `https://yali.vc/unsubscribe?token=<base64(email)>`
- List-Unsubscribe header set for one-click compliance

### Section types

| `_type` | Email output | Key fields |
|---|---|---|
| `openingNote` | Body text + author byline (no bold label) | `body`, `author` (ref) |
| `essay` | Bold label from `title`, body, optional author byline | `title`, `body`, `author` (optional ref) |
| `portfolioSpotlight` | Label: "PORTFOLIO · {company.name}", body | `company` (ref), `body`, `sectionTitle` (override) |
| `guestColumn` | Label, guest name + title/company meta, body | `guestName`, `guestTitle`, `guestCompany`, `body` |
| `radar` | Label + list: technology name + contributor + one-liner | `items[]` with `technology`, `oneLiner`, `contributor` (ref) |
| `reading` | Label + list of links with blurbs | `items[]` with `title`, `url`, `blurb` |
| `freeform` | Bold label from `title`, body | `title`, `body` |

All section labels render as uppercase crimson Courier New 18px. Portable text supports: `h2`, `h3`, `blockquote`, `normal` (p), `bullet`/`number` lists, `strong`, `em`, `code`, external links.

### Creating a new newsletter edition

1. In Sanity Studio at `yali.vc/console`, create a new `newsletter` document
2. Required: `title`, `slug`, `edition` (next integer after latest), `publishedDate`, `shortDescription`, at least one `section`
3. Set `status` to `draft` — beta sends work on drafts
4. Note the `_id` after saving (visible in Studio URL or via GROQ query)
5. Use "Send Beta Test" to validate rendering before touching the full list
6. Change `status` to `published`, then use "Send to Full List"

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
- Edit `src/proxy.js` without explicit instruction — changes affect all three domains simultaneously
