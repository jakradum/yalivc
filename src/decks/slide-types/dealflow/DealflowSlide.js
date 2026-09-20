// Rebuilt from the real legacy markup — the earlier draft had invented
// stage names ("Invite to Pitch") that don't match legacy at all. Real
// stages: AI Inbox, Team Vet, Initial Meeting, Internal Review, Pitch,
// Follow-on Meeting, Portfolio. Exit badges are NOT semantically colored
// in legacy (no red/green) — Ignore is gray, Pass is dark, Watch is gold,
// Park is a muted blue. Simplified: real arrow connectors between boxes
// (SVG line+triangle) kept; the dotted vertical connector lines above
// each exit badge column are not ported (decorative, low value alone).
const EXIT_STYLE = {
  Ignore: { bg: '#d0d0d0', fg: 'var(--deck-color-ink)' },
  Pass: { bg: 'var(--deck-color-ink)', fg: '#fff' },
  Watch: { bg: 'var(--deck-color-gold)', fg: 'var(--deck-color-ink)' },
  Park: { bg: '#5a8fa3', fg: '#fff' },
};

function Arrow() {
  return (
    <svg width={20} height={12} style={{ flexShrink: 0, alignSelf: 'center' }}>
      <line x1={0} y1={6} x2={13} y2={6} stroke="#888" strokeWidth={1.2} />
      <polygon points="13,3 19,6 13,9" fill="#888" />
    </svg>
  );
}

export function DealflowSlide({ heading, stages = [] }) {
  return (
    <div style={{ padding: '22px 36px 20px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 14, flexShrink: 0 }}>
        {heading}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'stretch', flex: 2, minHeight: 0 }}>
          {stages.map((s, i) => (
            <div key={s.name} style={{ display: 'contents' }}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: s.isFinal ? 'var(--deck-color-crimson)' : '#efefef',
                  border: s.isFinal ? 'none' : 'var(--deck-border)',
                  padding: '8px 6px',
                }}
              >
                <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, color: s.isFinal ? 'var(--deck-color-gold)' : 'var(--deck-color-ink)', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                  {s.name}
                </div>
                <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8, color: s.isFinal ? 'rgba(235,222,132,0.5)' : 'rgba(54,54,54,0.5)', marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>
                  {s.description}
                </div>
              </div>
              {i < stages.length - 1 ? <Arrow /> : null}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flex: 3, minHeight: 0, marginTop: 20 }}>
          {stages.map((s, i) => (
            <div key={s.name} style={{ display: 'contents' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.note ? (
                  <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 9, color: '#aaa', lineHeight: 1.5 }}>{s.note}</div>
                ) : null}
                {(s.exits || []).map((exit) => {
                  // An exit is a label, or { label, note } (e.g. the Pitch
                  // stage's Watch: "timing / maturity / consensus").
                  const label = typeof exit === 'string' ? exit : exit.label;
                  const note = typeof exit === 'string' ? null : exit.note;
                  return (
                    <div key={label} style={{ background: EXIT_STYLE[label]?.bg, padding: '7px 10px' }}>
                      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 10, fontWeight: 700, color: EXIT_STYLE[label]?.fg, letterSpacing: '0.06em' }}>{label}</div>
                      {note ? <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8, color: 'rgba(54,54,54,0.65)', lineHeight: 1.4, marginTop: 3 }}>{note}</div> : null}
                    </div>
                  );
                })}
              </div>
              {i < stages.length - 1 ? <div style={{ width: 20, flexShrink: 0 }} /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
