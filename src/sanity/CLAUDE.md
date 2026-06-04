# Sanity — Agent Context

> Loaded automatically when touching files under `src/sanity/`. Root `CLAUDE.md` is also loaded and contains the design system, routing, env vars, and global rules.

---

## Client Setup

- Read client: `useCdn: false` for all authenticated/dynamic pages
- Write client: requires `process.env.SANITY_WRITE_TOKEN` — only used in auth routes (OTP write-back, invite code redemption)
- All GROQ queries live in `src/lib/sanity-queries.js` — check here before writing a new query

## Query Gotchas

- `getAllBlogPosts()` returns `{ posts: [...], total: n }` — **not a plain array**. Always destructure: `const { posts = [] } = await getAllBlogPosts()`

---

## Two Schema Registries

Both must be kept in sync when adding or removing schema types:

| File | Used by |
|---|---|
| `src/sanity/schemas/index.js` | Next.js app |
| `src/sanity/schemaTypes.js` | Sanity Studio config |

**Known drift (not yet fixed):** `portalUser` is in `schemaTypes.js` but missing from `schemas/index.js`. `lpDownloadConsent` and `quarterlyReport` are in `schemas/index.js` but missing from `schemaTypes.js`. Fix both registries whenever next doing schema work.

---

## Sanity CDN URL Format

Asset `_ref` format: `image-{hash}-{width}x{height}-{ext}`

CDN URL: `https://cdn.sanity.io/images/nt0wmty3/production/{hash}-{width}x{height}.{ext}`

Add query params for resizing: `?w=280&fit=max&auto=format`

---

## Schema Field Reference

### `portalUser`
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

### `investor`
| Field | Type | Notes |
|---|---|---|
| `name` | string | Required. Display name (e.g., "Sequoia Capital") |
| `slug` | slug | Auto-generated from name |
| `type` | string | vc / angel / family-office / corporate / government / other |
| `website` | url | Optional |
| `logo` | image | Upload via Studio. Used in co-investor display and deck slides. |

LP investor logos: upload via Studio → Investors. When pulling logos for deck slides, query `investor` docs by name and construct the CDN URL from `logo.asset._ref`.

### `company` — key fields
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

### Non-obvious field behaviours

- `portalUser.isGiftCityLP` — controls whether `lpQuarterlyReport.giftCityFundFinancialsPdf` is shown in the quarterly PDF
- `lpFundSettings.rvpi` — fund metrics section only renders in the portal/PDF when values are actually populated; don't assume it's always present
- `lpQuarterlyReport.mediaNotes` — portable text array (not a string); each item has optional `link.href`. Use `renderMediaNotesBlocks()` in `generateQuarterlyPdf.js`
- `company` co-investors: each round's `coInvestors` array item has optional `displayOrder` (integer) for controlling render order
- `news.isVideo` (boolean) + `news.videoSource` (string URL) — always check `isVideo` before treating as article link; `videoSource` accepts YouTube URLs
- `investor.logo` — logo for co-investor display and deck slides; upload via Studio → Investors
