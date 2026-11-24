// The theses deck's segment-map slide, v3: a 4-column masonry grid
// (crimson tag-chip on the lead card only, everything else uses a quiet
// inline label; one lead segment + photo in column 1; title + a footer
// note in column 2; the remaining segments split across columns 3/4,
// proportioned by how much text each one carries; the lowest-priority
// tier demoted to a thin closing strip). Ported from a hand-built,
// single-sector (Robotics) HTML prototype — this version replaces every
// hand-placed pixel with either a shared CSS Grid line (so columns align
// by construction, not by measurement) or a proportional row-span
// formula (so it holds for all 6 sectors' different segment/tier
// counts, not just the one it was designed against).
const GRID_ROWS = 16;

const TIER_LABEL = {
  active: 'Searching actively',
  selective: 'Searching selectively',
  tracking: 'Tracking named companies',
  watching: 'Watching and evaluating',
  none: 'Not investing',
};

// `this` marks a phrase to highlight in gold, the same idea as `*Name*`
// marking a portfolio company elsewhere in this deck's content, just a
// different marker since gold-highlight and portfolio-crimson are two
// distinct meanings. No sector's Sanity content uses it yet, it's a
// no-op until someone marks a phrase, not a required convention.
// ~30% bigger than the old fixed 20px, scaled down for the sectors
// whose title just carries more words (Life Sciences' 105 chars vs
// Aerospace's 58) — same idea as the divider's own titleFontSize(),
// just tuned to this column's narrower width.
function titleFontSize(title) {
  const len = (title || '').length;
  if (len > 95) return 20;
  if (len > 65) return 23;
  return 26;
}

function renderHighlighted(text) {
  if (!text) return text;
  return text.split(new RegExp('(`[^`]+`)')).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <span key={i} style={{ background: 'var(--deck-color-gold)' }}>
        {part.slice(1, -1)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Proportional weight for a segment's card: base rows for the label +
// title + first body line, plus extra for a long segment name (wraps to
// a second title line around 26 chars at this column width) and extra
// per ~60 characters of decides text beyond the first line. This is the
// same idea as the old single-column layout's PX_PER_60_CHARS budget,
// just expressed as grid-row weight instead of a pixel minimum, because
// distributeRows() below normalizes weights to fit each column's exact
// row budget rather than relying on the sum happening to work out.
// A near-linear function of total text volume, not a small base plus a
// bonus — an earlier version used a dominant flat base (3) with only a
// +1 adjustment for length, which made distributeRows() (a *proportional*
// splitter) treat short and long segments almost identically since the
// base swamped the length signal. Verified against all 6 sectors' real
// content, not just one.
function othersLength(others) {
  return (others || []).reduce((sum, seg) => sum + (seg.text || '').length, 0);
}

function cardWeight(row) {
  const segLen = (row.segment || '').length;
  // Wrapping from one title line to two is a step, not a gradual cost —
  // a linear-only formula underweighted names right at that ~32-char
  // wrap threshold (e.g. "AI Drug Discovery & Computational Biology").
  const wrapPenalty = segLen > 32 ? 3 : 0;
  // `detail` and `leader`/`others` (the scope line and the "who's
  // leading" line) are real card content, not decoration — they were
  // simply never rendered in an earlier pass of this component (a
  // regression a content proofread against the source PDFs caught: every
  // segment carries this data, the masonry redesign just dropped it from
  // display). Both now render on every card, so both now cost real rows.
  const detailLen = (row.detail || '').length;
  const leaderLen = (row.leader || '').length + othersLength(row.others);
  // `detail` almost always wraps to 2 lines regardless of its exact
  // length (even the shortest ones don't fit this column's width on
  // one line), so it's weighted as a near-flat cost once present, not
  // purely proportional to character count.
  const detailWeight = detailLen ? 2 + detailLen / 40 : 0;
  return 1 + segLen / 9 + (row.decides || '').length / 13 + detailWeight + leaderLen / 16 + wrapPenalty;
}

// Distributes `totalRows` across `items` in proportion to cardWeight(),
// rounding down then handing the leftover rows to the items with the
// largest fractional remainder (largest-remainder apportionment) so the
// spans always sum to exactly `totalRows` — the column's tracks can
// never be over- or under-subscribed regardless of how many items or
// how long their text is.
function distributeRows(items, totalRows) {
  if (!items.length) return [];
  const weights = items.map((r) => cardWeight(r));
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / sum) * totalRows);
  const floors = raw.map(Math.floor);
  let remainder = totalRows - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder && k < order.length; k++) floors[order[k].i] += 1;
  return floors.map((f) => Math.max(f, 2));
}

// Font size scales down by tier priority, not just by row-span — the
// original single-column layout (before this masonry redesign) proved
// this pattern across all 6 sectors: "active" tier segments are few and
// get the most weight/room, while "selective"/"tracking"/"watching"
// cards are both more numerous AND more likely to carry longer decides
// text, so they need to run smaller to fit the same proportional space.
const SCALE = {
  active: { title: 13, decides: 10 },
  selective: { title: 11.5, decides: 9.5 },
  tracking: { title: 10, decides: 9 },
  watching: { title: 10, decides: 9 },
  none: { title: 9.5, decides: 8.5 },
};

// `others` is pre-split by mapFromTheses.js into [{ text, portfolio }] —
// a Yali portfolio company renders in crimson, everything else inherits.
function Others({ segments = [] }) {
  return (
    <>
      {segments.map((seg, i) => (
        <span key={i} style={{ color: seg.portfolio ? 'var(--deck-color-crimson)' : 'inherit', fontWeight: seg.portfolio ? 700 : 400 }}>
          {seg.text}
        </span>
      ))}
    </>
  );
}

function Segment({ segment, detail, decides, leader, others, tier, dim }) {
  const s = SCALE[tier] || SCALE.selective;
  return (
    <>
      {detail ? (
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7.5, color: dim ? 'rgba(54,54,54,0.35)' : 'rgba(54,54,54,0.6)', letterSpacing: '0.02em', lineHeight: 1.15, display: 'block', marginTop: 2 }}>
          {detail}
        </span>
      ) : null}
      <div style={{ marginTop: 2 }}>
        <span
          style={{
            fontFamily: 'var(--deck-font-mono)',
            fontSize: s.title,
            fontWeight: 800,
            color: dim ? 'rgba(54,54,54,0.4)' : 'var(--deck-color-ink)',
            lineHeight: 1.18,
            textDecoration: dim ? 'line-through' : 'none',
          }}
        >
          {segment}
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--deck-font-body)',
          fontSize: s.decides,
          color: dim ? 'rgba(54,54,54,0.4)' : 'var(--deck-color-ink)',
          lineHeight: 1.2,
          marginTop: 2,
          display: 'block',
        }}
      >
        {decides}
      </span>
      {leader && !dim ? (
        <div style={{ marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7.5, fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            {leader}
          </span>
          {others?.length ? (
            <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 7.5, color: 'rgba(54,54,54,0.6)' }}>
              {' '}
              <Others segments={others} />
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function TierLabel({ tier, dim }) {
  return (
    <span
      style={{
        fontFamily: 'var(--deck-font-mono)',
        fontSize: 7,
        fontWeight: 700,
        color: dim ? 'rgba(54,54,54,0.45)' : 'var(--deck-color-crimson)',
        letterSpacing: '0.09em',
        lineHeight: 1.2,
        textTransform: 'uppercase',
      }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

function Card({ row, gridColumn, gridRow }) {
  const dim = row.position === 'none';
  return (
    <div
      style={{
        gridColumn,
        gridRow,
        border: `1px solid ${dim ? 'rgba(54,54,54,0.35)' : 'var(--deck-color-ink)'}`,
        boxSizing: 'border-box',
        padding: '5px 12px 5px',
        overflow: 'hidden',
      }}
    >
      <TierLabel tier={row.position} dim={dim} />
      <Segment segment={row.segment} detail={row.detail} decides={row.decides} leader={row.leader} others={row.others} tier={row.position} dim={dim} />
    </div>
  );
}

export function SectorMapSlide({ eyebrow, title, rows = [], footers = [], railImageUrl, railImageUrl2 }) {
  const lead = rows[0];
  const noneRow = rows.find((r) => r.position === 'none' && r !== lead);
  let middle = rows.filter((r) => r !== lead && r !== noneRow);
  // Denser sectors (Life Sciences and Robotics: 9 segments each, every
  // card now also carrying its scope line and "who's leading" line —
  // see cardWeight()) don't fit columns 3/4's combined budget no matter
  // how far font-size/padding are tightened, and re-weighting proportions
  // alone can't fix a column that's over budget in total, only shuffle
  // the shortage between cards. Demote as many lowest-priority segments
  // (from the end, in tier order) as it takes to get under the target,
  // not just one regardless of how far over.
  const extraFooterRows = [];
  while (middle.length > 3) {
    extraFooterRows.push(middle[middle.length - 1]);
    middle = middle.slice(0, -1);
  }

  // Column 4 carries a lead photo above its cards, so its text budget is
  // GRID_ROWS - PHOTO_ROWS while column 3's is the full GRID_ROWS. Items
  // are assigned by their actual text WEIGHT, not by count — splitting
  // by count let one column end up with several verbose segments while
  // its sibling got short ones, overflowing regardless of how generous
  // the per-card formula was. Greedily give each item to whichever
  // column is currently furthest below its weight-per-row capacity, so
  // both columns end up proportionally, not just numerically, balanced.
  const PHOTO_ROWS = 7;
  const col3Budget = GRID_ROWS;
  const col4Budget = GRID_ROWS - PHOTO_ROWS;
  const col3Rows = [];
  const col4Rows = [];
  let col3Weight = 0;
  let col4Weight = 0;
  [...middle]
    .sort((a, b) => cardWeight(b) - cardWeight(a))
    .forEach((r) => {
      const w = cardWeight(r);
      const ratio3 = col3Weight / col3Budget;
      const ratio4 = col4Weight / col4Budget;
      if (ratio4 <= ratio3) {
        col4Rows.push(r);
        col4Weight += w;
      } else {
        col3Rows.push(r);
        col3Weight += w;
      }
    });
  // Restore original (tier) order within each column rather than the
  // weight-sorted order used just for the greedy split.
  col3Rows.sort((a, b) => middle.indexOf(a) - middle.indexOf(b));
  col4Rows.sort((a, b) => middle.indexOf(a) - middle.indexOf(b));

  const col3Spans = distributeRows(col3Rows, col3Budget);
  const col4Spans = distributeRows(col4Rows, col4Budget);

  let cursor3 = 1;
  let cursor4 = PHOTO_ROWS + 1;

  const footerLineCount = extraFooterRows.length + (noneRow ? 1 : 0);
  const gridBottom = footerLineCount > 1 ? 44 + (footerLineCount - 1) * 16 : 44;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', boxSizing: 'border-box' }}>
      <div
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          top: 20,
          bottom: gridBottom,
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gridTemplateRows: `repeat(${GRID_ROWS},1fr)`,
          columnGap: 20,
          rowGap: 14,
        }}
      >
        {lead ? (
          <div
            style={{
              gridColumn: 1,
              gridRow: `1 / ${GRID_ROWS + 1}`,
              position: 'relative',
              border: '1px solid var(--deck-color-ink)',
              boxSizing: 'border-box',
              padding: '22px 16px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ position: 'absolute', top: -11, left: 14, background: 'var(--deck-color-crimson)', padding: '4px 10px' }}>
              <span
                style={{
                  fontFamily: 'var(--deck-font-mono)',
                  fontSize: 7.5,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#efefef',
                  lineHeight: 1.2,
                }}
              >
                {TIER_LABEL[lead.position]}
              </span>
            </div>
            {lead.detail ? (
              <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7, color: 'rgba(54,54,54,0.6)', letterSpacing: '0.04em', lineHeight: 1.2, display: 'block', marginBottom: 3 }}>
                {lead.detail}
              </span>
            ) : null}
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--deck-color-ink)', lineHeight: 1.3 }}>
              {lead.segment}
            </span>
            <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 9.9, color: 'var(--deck-color-ink)', lineHeight: 1.45, marginTop: 6 }}>
              {lead.decides}
            </span>
            {lead.leader ? (
              <div style={{ marginTop: 5 }}>
                <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7, fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {lead.leader}
                </span>
                {lead.others?.length ? (
                  <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 7, color: 'rgba(54,54,54,0.6)' }}>
                    {' '}
                    <Others segments={lead.others} />
                  </span>
                ) : null}
              </div>
            ) : null}
            {railImageUrl ? (
              <div style={{ marginTop: 12, border: '1px solid var(--deck-color-ink)', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={railImageUrl} alt="" style={{ width: '100%', height: 82, objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)', display: 'block' }} />
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ gridColumn: 2, gridRow: `1 / 11`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span
            style={{
              fontFamily: 'var(--deck-font-mono)',
              fontSize: 7,
              fontWeight: 700,
              color: 'var(--deck-color-crimson)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              lineHeight: 1.4,
            }}
          >
            {eyebrow}
          </span>
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: titleFontSize(title), fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1.22, letterSpacing: '-0.01em', marginTop: 12 }}>
            {renderHighlighted(title)}
          </div>
        </div>

        {footers.length ? (
          <div
            style={{
              gridColumn: 2,
              gridRow: `11 / ${GRID_ROWS + 1}`,
              border: '1px solid var(--deck-color-ink)',
              boxSizing: 'border-box',
              padding: '10px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {footers.slice(0, 2).map((f) => (
              <div key={f.label}>
                <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7, fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '0.09em', lineHeight: 1.2, textTransform: 'uppercase' }}>
                  {f.label}
                </span>
                <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8.3, color: 'var(--deck-color-ink)', lineHeight: 1.3, marginTop: 4, display: 'block' }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {col3Rows.map((r, i) => {
          const span = col3Spans[i];
          const start = cursor3;
          cursor3 += span;
          return <Card key={r.segment} row={r} gridColumn={3} gridRow={`${start} / ${start + span}`} />;
        })}

        {railImageUrl2 ? (
          <div style={{ gridColumn: 4, gridRow: `1 / ${PHOTO_ROWS + 1}`, border: '1px solid var(--deck-color-ink)', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={railImageUrl2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)', display: 'block' }} />
          </div>
        ) : null}

        {col4Rows.map((r, i) => {
          const span = col4Spans[i];
          const start = cursor4;
          cursor4 += span;
          return <Card key={r.segment} row={r} gridColumn={4} gridRow={`${start} / ${start + span}`} />;
        })}
      </div>

      {extraFooterRows.length || noneRow ? (
        <div style={{ position: 'absolute', left: 36, right: 96, bottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {extraFooterRows.map((r) => (
            <span key={r.segment} style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8, color: 'var(--deck-color-ink)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <TierLabel tier={r.position} />
              <span>
                <b style={{ fontFamily: 'var(--deck-font-mono)', color: 'var(--deck-color-ink)' }}>{r.segment}</b> {r.decides}
              </span>
            </span>
          ))}
          {noneRow ? (
            <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8, color: 'rgba(54,54,54,0.45)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <TierLabel tier="none" dim />
              <span>
                <b style={{ fontFamily: 'var(--deck-font-mono)', textDecoration: 'line-through' }}>{noneRow.segment}</b> {noneRow.decides}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
