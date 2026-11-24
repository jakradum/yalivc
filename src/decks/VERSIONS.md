# Deck versions

Each deck's version lives in one place: `cover.version` in its data file
(`src/decks/data/fixtures/<deck>.json`). `src/decks/core/deckVersion.js` carries
it to:

- the cover, as a faint fine-print stamp with the generation date
  (`fund2-deck-v3.0 · 9 Nov 2026`);
- the PDF's Title metadata (`Yali Capital Fund II · fund2-deck-v3.0`);
- the download filename (`fund2-deck-v3.0.pdf`).

Bump the version in the data file and add a row below in the same change.

## Bump rules

Carried over from the legacy HTML decks (`docs/CLAUDE.md`, "Deck versioning policy").

**Major (v2 to v3): the story changed.**
- A sector or thesis category is added, removed or redefined.
- Fund terms or structure materially change (fund size, strategy, key terms).
- A whole section is added or removed.
- The narrative pivots (audience, positioning, thesis framing).

**Minor (v3.0 to v3.1): the same story, refreshed or told better.**
- Design refinements and bug fixes.
- Data updates that don't change structure (new quarter's numbers, a new
  portfolio company in an existing table, an exit tag).
- Copy edits that don't change substance.

If you'd explain the change as "we now also think about X", it's major; if
"we fixed/updated X", it's minor.

## Fund II (`fund2-deck`)

| Version | Date | What changed |
|---|---|---|
| v1.2 | | Legacy HTML (`docs/fund2-deck-v1.2.html`). |
| v2.0 | | Legacy HTML (`docs/fund2-deck-v2.0.html`): four adjacent sectors added to the investment-areas diagram. |
| v3.0 | 9 Nov 2026 | First versioned build of the React deck. Fund size ₹2,100 Cr + ₹900 Cr greenshoe (major: fund terms). Also: Q2 FY27 (Sep 2026) Fund I summary and portfolio, C2i and Tonbo marked Exited with exit values, Tonbo listed on NSE 23 Oct 2026, near-term deployment ₹20 Cr Smart Manufacturing + ₹15 Cr Perceptyne, monogram-only logo. |
| v3.1 | 9 Nov 2026 | Fund I snapshot (slide 15) in two columns, as of Sep '26 and current post exits, per Sunil: realised proceeds ₹514.16 Cr, 7 active and 2 fully exited companies, DPI 1.14x, RVPI 0.86x. |
| v3.2 | 9 Nov 2026 | Fund I snapshot: values that changed after the exits highlighted with a solid gold marker in the current column. |
| v3.3 | 9 Nov 2026 | New slide after the Fund I portfolio: Fund I · Realised Exits (C2i and Tonbo, invested ₹93.57 Cr, exit value ₹514.16 Cr, 5.49x). Key terms: ₹900 Cr greenshoe set at the same size as the fund size. |
| v3.4 | 22 Nov 2026 | Per Gani, ahead of Premji Invest: key terms Term 12 + 1 + 1 (was 10 + 1 + 1) and "Investment Period" renamed Commitment Period (PPM wording); team photo grid (old slide 4) removed as a repeat of the profile slides, deck now 32 slides. LP network slide (19): Japan added to the flags and the CXO list. PDF made by editing the v3.3 PDF; source updated to match. |

## Investment Theses (`theses-deck`)

| Version | Date | What changed |
|---|---|---|
| v1.0 | | Graphic sector maps and tests. |
| v1.1 | 9 Nov 2026 | Content-first redesign: Q&A pages with JetBrains Mono questions, running-index dividers, no eyebrows, diamond-chain pattern cover with monogram cut-out. |
| v1.2 | 13 Nov 2026 | Word check against the 25 Sep source deck: restored the Robotics test figure "<$6,000" that the Q&A layout had dropped. Last version built from this repo (React deck). |
| v2.0 | 13 Nov 2026 | Now built in `StarterPack/theses-decks` (`versions.json` → `full`). Major: Sandipan's seven sector decks consolidated (each sector's map and what-wins pages replace the Q&A pages) and the Advanced Materials, Quantum and Space Tech deep dives added. No sentence headlines, bottom bubbles or position column; "What decides the winner" kept pending the Gani deep dive. Cover without the month. (Shipped earlier the same day as "theses-full-v1.0".) |

## Investment Theses Overview (`theses-overview`)

The in-between deck: one slide per sector. Built in `StarterPack/theses-decks` (`versions.json` → `overview`; see its README). Same bump rules as above.

| Version | Date | What changed |
|---|---|---|
| v1.0 | 13 Nov 2026 | One slide per sector, segments as boxes (header, global leader, Indian companies), per the 13 Nov meeting notes. Smart Manufacturing: agtech out, Factory Sensing & Vision (inspection + industrial IoT), Electronics & EV Manufacturing (Ultraviolette, Micropack); header alternatives as PDF annotations. |
| v1.1 | 13 Nov 2026 | Redesign: white W4 cards (crimson number tab, India and Global rows with a grey label column, crimson offset behind cards holding a Yali company), each segment's descriptor line from the source decks, and the M1 cover (the main pattern cover inverted to white). |
| v1.2 | 13 Nov 2026 | A separator before each sector (category line drawing, sector index at the foot; the cover's diamond pattern for Other Deep Tech). Cover without the month. |
| v1.3 | 13 Nov 2026 | Other Deep Tech separator gets its own drawing: a crystal cluster (Gemini pro, centre-line traced to `theses-decks/assets/cat-deep.svg`), in place of the pattern. |
| v1.4 | 13 Nov 2026 | Portfolio offset behind cards holding a Yali company changed from crimson to pale gold (#ebde84 at 60% on white, as solid #f3ebb5); legend swatch to match. |
