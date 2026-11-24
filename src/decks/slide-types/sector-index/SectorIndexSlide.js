// Theses deck section divider (Q&A layout): every section stacked, the
// current one in crimson and larger, the rest greyed; the sector's
// one-line thesis sits to the right. Wayfinding only, no imagery.
// `sections` is the full [{ index, name }] list, built in the manifest
// from the deck's own dividers so it can never drift from the deck.
export function SectorIndexSlide({ name, subtitle, sections = [] }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', padding: '48px 56px', gap: 44 }}>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {sections.map((s) => {
          const on = s.name === name;
          return (
            <li
              key={s.name}
              style={{
                display: 'flex',
                gap: 18,
                alignItems: 'baseline',
                padding: '7px 0',
                borderBottom: on ? '1.5px solid var(--deck-color-crimson)' : '0.5px solid rgba(54,54,54,0.22)',
                color: on ? 'var(--deck-color-crimson)' : 'rgba(54,54,54,0.32)',
              }}
            >
              <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 12, width: 24, flexShrink: 0 }}>{s.index}</span>
              <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: on ? 30 : 24, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{s.name}</span>
            </li>
          );
        })}
      </ol>
      <div style={{ width: 300, flexShrink: 0, display: 'flex', alignItems: 'center', borderLeft: '1.5px solid var(--deck-color-ink)', paddingLeft: 28 }}>
        <p style={{ margin: 0, fontFamily: 'var(--deck-font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--deck-color-ink)' }}>{subtitle}</p>
      </div>
    </div>
  );
}
