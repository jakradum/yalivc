// A single shared slide for the four adjacent deep-tech sectors (Space
// Tech, Quantum, Energy, Advanced Materials) that don't get their own
// divider/map/tests trio — each carries just one row's worth of content
// (Sanity's `asRow`), so one row of four bordered cards is the whole
// slide, not a masonry grid. Same visual grammar as SectorMapSlide.js
// (bordered card, quiet inline tier label, portfolio names in crimson),
// intentionally not shared code with it since the two layouts don't
// otherwise overlap.
// Every `asRow` in the four adjacent sectors happens to carry
// position:"selective" today, but the label is real data (not a
// constant caption) — rendering it explicitly rather than assuming it's
// always "selective" so this doesn't silently go stale if that changes.
const TIER_LABEL = {
  active: 'Searching actively',
  selective: 'Searching selectively',
  tracking: 'Tracking named companies',
  watching: 'Watching and evaluating',
  none: 'Not investing',
};

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

function Card({ row }) {
  return (
    <div style={{ flex: 1, border: '1px solid var(--deck-color-ink)', boxSizing: 'border-box', padding: '18px 16px', display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7, fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '0.09em', textTransform: 'uppercase', lineHeight: 1.2 }}>
        {TIER_LABEL[row.position] || row.position}
      </span>
      <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 6.5, color: 'rgba(54,54,54,0.6)', letterSpacing: '0.04em', lineHeight: 1.2, display: 'block', marginTop: 4 }}>
        {row.detail}
      </span>
      <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--deck-color-ink)', lineHeight: 1.2, marginTop: 5 }}>
        {row.segment}
      </span>
      <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 9.35, color: 'var(--deck-color-ink)', lineHeight: 1.4, marginTop: 6 }}>
        {row.decides}
      </span>
      <div style={{ marginTop: 18, paddingTop: 10, borderTop: '1px solid rgba(54,54,54,0.2)' }}>
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7, fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {row.leader}
        </div>
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 7.5, color: 'rgba(54,54,54,0.78)', lineHeight: 1.4, marginTop: 3 }}>
          <Others segments={row.others} />
        </div>
      </div>
    </div>
  );
}

export function OtherDeepTechSlide({ eyebrow, title, subtitle, rows = [], notInvesting, footers = [], railImageUrl }) {
  const footerAreaHeight = 34 + (notInvesting ? 18 : 0);
  // The header text wraps a bit narrower when there's a photo, so the
  // inset has clear room rather than sitting on top of the title.
  const headerRight = railImageUrl ? 170 : 36;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', boxSizing: 'border-box' }}>
      {railImageUrl ? (
        <div style={{ position: 'absolute', right: 36, top: 22, width: 118, height: 88, border: '1px solid var(--deck-color-ink)', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={railImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)', display: 'block' }} />
        </div>
      ) : null}
      <span
        style={{
          position: 'absolute',
          left: 36,
          top: 24,
          fontFamily: 'var(--deck-font-mono)',
          fontSize: 8,
          fontWeight: 700,
          color: 'var(--deck-color-crimson)',
          letterSpacing: '0.17em',
          textTransform: 'uppercase',
          lineHeight: 1.3,
        }}
      >
        {eyebrow}
      </span>
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: 44,
          right: headerRight,
          fontFamily: 'var(--deck-font-mono)',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--deck-color-ink)',
          lineHeight: 1.16,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div style={{ position: 'absolute', left: 36, top: 92, right: 36, fontFamily: 'var(--deck-font-body)', fontSize: 9, color: 'rgba(54,54,54,0.68)', lineHeight: 1.4 }}>
          {subtitle}
        </div>
      ) : null}

      <div style={{ position: 'absolute', left: 36, right: 36, top: 118, bottom: 20 + footerAreaHeight, display: 'flex', alignItems: 'stretch', gap: 20 }}>
        {rows.map((r) => (
          <Card key={r.segment} row={r} />
        ))}
      </div>

      <div style={{ position: 'absolute', left: 36, right: 96, bottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {notInvesting ? (
          <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8, color: 'rgba(54,54,54,0.45)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7, fontWeight: 700, color: 'rgba(54,54,54,0.45)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              {TIER_LABEL.none}
            </span>
            <span>
              <b style={{ fontFamily: 'var(--deck-font-mono)', textDecoration: 'line-through' }}>{notInvesting.segment}</b> {notInvesting.decides}
            </span>
          </span>
        ) : null}
        {footers.length ? (
          <div style={{ display: 'flex', gap: 36 }}>
            {footers.slice(0, 2).map((f) => (
              <span key={f.label} style={{ flex: 1, fontFamily: 'var(--deck-font-body)', fontSize: 8, color: 'rgba(54,54,54,0.68)' }}>
                <span style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '0.08em' }}>{f.label.toUpperCase()}</span>: {f.text}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
