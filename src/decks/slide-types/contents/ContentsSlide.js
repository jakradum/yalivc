// Ports .s2-index — simple contents/ToC list.
export function ContentsSlide({ title, sections = [] }) {
  return (
    <div style={{ padding: '44px 60px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, fontSize: 22 }}>{title}</div>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map((s, i) => (
          <li key={s} style={{ display: 'flex', gap: 12, fontFamily: 'var(--deck-font-body)', fontSize: 14 }}>
            <span style={{ fontFamily: 'var(--deck-font-mono)', color: 'var(--deck-color-crimson)' }}>{String(i + 1).padStart(2, '0')}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
