# News monitor — scheduled routine prompt

This is the prompt used by the twice-weekly scheduled cloud agent. Keep it in
sync with `sources.json`. Cron: `0 7 * * 1,4` (Mon & Thu 07:00, Asia/Kolkata).

---

You run twice a week (Monday and Thursday). Each run: gather recent news in two
categories, deduplicate against Sanity, and add new items to **this week's
`newsDigest` document** (one document per ISO week). The Monday run creates the
week's document; the Thursday run patches new items into that same document.
`upsert.mjs` handles the create-vs-patch and all dedup. Fill Sanity silently: no
digest email, no message, no summary to anyone.

**Run id:** `YYYY-MM-DD-<dow>` (lowercase 3-letter day, e.g. `2026-09-07-mon`).
**Recency window:** only items published in the last 5 days.
**Timezone:** Asia/Kolkata.
**Working dir:** repo root. Source lists: `scripts/news-monitor/sources.json`.

## Category A — deep-tech

Search the sources in `sources.json > deepTech.sources` plus general web search
for each Yali thesis ("robotics funding news this week", etc.). Keep items
relevant to at least one thesis (Life Sciences, Robotics, Fabless Semiconductor,
AI, Smart Manufacturing, Aerospace & Surveillance) and set `thesis` to the best
fit. Prefer the `deepTech.prefer` list; skip the `deepTech.skip` list.

## Category B — india-macro (international sources only)

Goal: macroeconomic news about India written by credible non-Indian outlets.

- **Allowed sources only:** `sources.json > indiaMacro.allowedSources`.
- **Hard blocklist, never include:** `sources.json > indiaMacro.blocklist`. If you
  cannot confirm a source is non-Indian and on the allowed list, drop the item.
- **Relevance filter:** include only if the story materially concerns one of
  `sources.json > indiaMacro.relevanceTopics`.
- **Exclude:** `sources.json > indiaMacro.excludeTopics`.
- Set `angle` to a short tag for the India hook (e.g. "RBI rate path", "rupee
  weakness", "US-India tariffs", "Fitch outlook", "China+1 electronics").

## Summary format (both categories)

`summary` is an array of **3 to 6 bullets**. Be thorough and concrete: a reader
should not need to open the article. Cover, in order:

1. **What happened** — the specific event/announcement/data, with key numbers
   (amounts, %, dates, names).
2. **Context** — prior state, comparison, or why now.
3. **Mechanism / detail** — how it works, who is involved, the terms.
4. **Why it matters for Yali** — the deep-tech thesis implication; for
   india-macro, the channel through which it hits growth / rates / capital flows
   / the sectors Yali invests in.
5. **What to watch next** — the next milestone, decision, or data point, with
   rough timing if known.

Each bullet is 1 to 3 full sentences. Attribute figures to the source. No em
dashes. Do not speculate beyond the source; if something is unconfirmed, say so.

## Fields per item

`headline` (one line, your words) · `url` (canonical, verbatim) · `source` ·
`category` (`deep-tech` | `india-macro`) · `thesis` (deep-tech only) · `angle`
(india-macro only) · `summary` (bullet array) · `publishedDate` (YYYY-MM-DD) ·
`runId` (today's run id) · `notable` (true only for major policy shifts, large
rounds in a Yali sector, ratings actions, national-scale capex; default false).

## Caps

Max **20 deep-tech + 15 india-macro** new items per run. If more qualify, keep
the most significant.

## Write procedure

1. Build candidates with all fields, each tagged with today's `runId`. Fetch
   each article to confirm figures and, for india-macro, confirm the source is
   non-Indian and allowed.
2. Write the final candidate array as JSON and pipe it to:
   `node scripts/news-monitor/upsert.mjs`
   It resolves this week's `newsDigest` document (creating it on the Monday
   run), dedupes each item by URL against this week's and last week's document,
   appends the new ones, records the run id, and prints the summary line.
3. Emit exactly that one line as the run's only output. Nothing else. Do not
   send any message or digest.

If a step fails (network, auth), log the reason and exit. Do not retry
aggressively or fabricate items. A run that finds nothing new is normal: still
pipe an empty array `[]` to `upsert.mjs` so the Monday run creates the week's
document, then log the summary line and stop.
