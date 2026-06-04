# Data Room — Agent Context

> Loaded automatically when touching files under `src/app/(dataroom)/`. Root `CLAUDE.md` is also loaded and contains the design system, routing, env vars, and global rules.

---

## Auth — Dataroom (`dataroom-session` cookie)

- OTP flow via `/api/dataroom-auth/route.js`
- Verifier: `src/lib/session.js` — same as portal, returns `email` string or `null`
- `redirect` must be imported from `next/navigation`, NOT `next/headers`
- Trusted domains (no Sanity lookup needed): `@yali.vc`, `@florintree.com`
- Non-trusted access: `portalUser.investorDataRoomAccess == true` OR active `domainPrivilege` Sanity doc
- `domainPrivilege` modes:
  - `requireCode: true` — user must enter a shared invite code
  - `requireCode: false` — anyone with a matching email domain gets in automatically
- Kill switch: `noAccess: true` on `portalUser` blocks even trusted domains and domain-privilege users

---

## Categories & Access

- Full auth gate on both `/dataroom` (landing) and `/dataroom/[category]`
- Valid categories: `fund-i`, `fund-ii`, `team`, `track-record`, `recommendations`
- **`portfolio` category requires a `portalUser` record** — domain privilege alone is not enough
- Documents managed via `fundContent` Sanity document type
- Latest LP report shown under Fund I section (fetched via `getLatestLPReportForDataRoom`)

---

## PDF Generation

- Route: `/api/generate-pdf/[slug]` — **local-only, never called in production**
- Same Hobby plan constraint as the portal PDF route: `maxDuration: 60`, never hit on Vercel
