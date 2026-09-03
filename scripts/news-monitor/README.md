# news-monitor

Twice-weekly automated news capture for Yali Capital. A scheduled cloud agent
(routine) searches the web in two categories and stores new items in Sanity in
**one `newsDigest` document per week**. The Monday run creates the week's
document; the Thursday run patches new items into it. Not shown on the public
site; review in Studio at `/console` → "News Digest (Weekly)".

## Pieces

| File | Role |
|---|---|
| `sources.json` | Curated source lists, filters, blocklist, caps. Tune this. |
| `routine-prompt.md` | The prompt the scheduled agent runs. Keep in sync with `sources.json`. |
| `upsert.mjs` | Adds an item array (stdin JSON) to the current week's digest. Dedupes by normalised URL against this week's and last week's document. |
| `src/sanity/schemas/newsDigest.js` | The document type (`newsDigest`, with an `intelEntry` object per item). |

## Categories

- **deep-tech** — news across the six Yali theses (Life Sciences, Robotics,
  Fabless Semiconductor, AI, Smart Manufacturing, Aerospace & Surveillance).
- **india-macro** — India macroeconomic news from credible **non-Indian**
  sources only (Reuters, Bloomberg, FT, The Economist, WSJ, Nikkei Asia, IMF,
  World Bank, OECD, BIS, rating agencies). Indian outlets are blocklisted.

## Schedule

Cron `0 7 * * 1,4` — Monday and Thursday 07:00, Asia/Kolkata. Managed as a
Claude Code routine (`/schedule`).

## Manual run / testing

```bash
# dry run: validate + show what would be created, no write
cat items.json | node scripts/news-monitor/upsert.mjs --dry-run

# real write (needs SANITY_WRITE_TOKEN in .env.local)
cat items.json | node scripts/news-monitor/upsert.mjs
```

`items.json` is a JSON array; see the field list at the top of `upsert.mjs`.

## Retention

Keep forever. No archiving job. One `newsDigest` document accumulates per week.
Dedup uses a stable per-URL `_key` within the week's and prior week's document,
so re-running a window will not create duplicates.
