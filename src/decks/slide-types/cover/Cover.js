// Faithful port of the legacy cover slide (fund2-deck-v2.0.html, "bg-crimson s1")
// for Phase 1's fidelity check. Simplified: no hex-pattern strip, no
// deck-version footer yet — those port over in Phase 3, this just proves
// the pipeline with real data through props.
export function Cover({ title, subtitle }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--deck-color-crimson)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        color: '#fff',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--deck-font-mono)',
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: 'var(--deck-font-body)',
          fontSize: 13,
          opacity: 0.75,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}
