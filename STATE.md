# STATE.md — yali-site work-in-progress

> Written for AI agents. Documents state that cannot be derived from code or git history alone.
> Update this file when starting, finishing, or deferring any meaningful piece of work.

---

## Current focus

No active task. Awaiting next instruction.

---

## Recently completed (decisions worth remembering)

- **`deckAsset` schema removed.** Investor logos now live on the `investor` schema's existing `logo` image field. Do not recreate a `deckAsset` schema.
- **`docs/` gitignored.** The `docs/` folder was previously tracked in a public repo. It is now in `.gitignore` and local-only. Do not try to commit anything from `docs/`.

---

## Known issues

- **Schema registry drift.** Two schema registries must stay in sync (see CLAUDE.md), but they have diverged:
  - `portalUser` is in `schemaTypes.js` (Studio) but **missing** from `schemas/index.js` (app registry).
  - `lpDownloadConsent` and `quarterlyReport` are in `schemas/index.js` but **missing** from `schemaTypes.js`.
  - Fix: add the missing imports/entries to whichever file lacks them before the next schema-touching task.

- **`submit-application` auto-reply not implemented.** A `// TODO Phase 2A` comment in `src/app/api/submit-application/route.js` marks where a Resend confirmation email to the applicant should be triggered. The form saves to Sanity but sends no reply.

- **In-memory rate limiting in auth routes.** `portal-auth` and `dataroom-auth` use an in-memory `Map` that resets on cold start. Code comments note Redis as the proper fix. Acceptable at current scale; silent gap under multi-instance or high-traffic conditions.

---

## Deferred / intentionally not done

- **PDF generation is local-only.** Routes `/partners/api/generate-pdf/[slug]` and `/api/generate-pdf/[slug]` have `maxDuration: 60` to satisfy Vercel build validation only. They are never called in production. Do not attempt to make them production-ready on the Hobby plan.

- **`docs/` is not backed up in the repo.** All pitch decks, letters, and generated PDFs exist only on the machine where they were last generated. This is intentional.

- **Newsletter sends are fully manual.** No scheduled or event-triggered send automation is planned. All sends go through Studio UI or curl.

---

## Pending decisions

None currently.

---

## Do not touch

- **`src/proxy.js`** — Next.js middleware handling subdomain rewrites AND HMAC session verification for both portal and dataroom. Any change here affects all three domains simultaneously and can lock users out. Do not edit without explicit instruction.

- **PDF route `maxDuration`** — Set to 60 on both PDF generation routes. This is the Vercel Hobby plan hard ceiling. Do not raise it; the build will fail. The routes are local-only by design, so there is no reason to raise it.

---

## Environment / deployment state

- `staging` and `main` are in sync at the same commit. No unreleased features on any branch.
- `docs/` exists only locally. Not portable to a new machine without regenerating from the HTML source files.
