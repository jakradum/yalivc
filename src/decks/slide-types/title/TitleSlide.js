// Pixel-matched to legacy .s-fii-blank ("Fund II · Fund Structure"): a light
// slide with a small crimson eyebrow, a 48px mono title and a grey note,
// anchored bottom-left.
export function TitleSlide({ eyebrow, title, note }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '52px 60px' }}>
      {eyebrow ? <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 14 }}>{eyebrow}</div> : null}
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 48, fontWeight: 400, color: 'var(--deck-color-ink)', lineHeight: 1.1, whiteSpace: 'pre-line' }}>{title}</div>
      {note ? <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 12, color: '#aaa', marginTop: 20 }}>{note}</div> : null}
    </div>
  );
}
