// Ports .s3-div/.fi-div — crimson full-bleed section divider (heading +
// sub). Pattern-bank background (p1-p7 JS-tiled SVG per docs/CLAUDE.md)
// intentionally NOT included here yet — that's its own follow-up
// component, since CSS background-image SVG patterns break in Chrome PDF.
export function SectionDivider({ heading, sub }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--deck-color-crimson)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, fontSize: 32, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'pre-line' }}>
        {heading}
      </div>
      {sub ? (
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 13, opacity: 0.8 }}>{sub}</div>
      ) : null}
    </div>
  );
}
