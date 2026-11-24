// The theses deck's "why now" / proof slide, v3: three bordered proof
// cards (title, body, a bold crimson stat, a small B&W photo, the source
// line) with no label chip — a generic "Proof 01/02/03" tag was tried
// and dropped as noise, each card's own title already identifies it.
// Below, three why-now stat cards DO carry a chip, because there the
// label (Installed / Capital / Cost) is the thing that makes the number
// legible at a glance, not decoration. Same grid discipline as
// SectorMapSlide.js: shared CSS lines for anything that must align,
// nothing hand-placed in pixels.
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

// The crimson stat only reads as a "figure" when it actually carries a
// number — a source PDF sometimes has a word there instead ("ACQUIRED",
// "YEARS", "HARDWARE"), which loses its punch at 24px bold with nothing
// numeric behind it. Left in the data (not stripped), just not
// promoted to the big stat treatment.
function isNumericFigure(figure) {
  return /\d/.test(figure || '');
}

// If evidence was authored as "$28M — 2026's largest Indian robot
// round, raised by Unbox Robotics..." (figure leading its own
// explanation, em-dash separated), split it so the figure renders once,
// big and crimson, with the rest of the sentence continuing right under
// it — not as a bare number sitting disconnected above an unrelated
// caption below the photo, which is what this looked like before.
function splitEvidence(evidence, figure) {
  if (!evidence || !figure) return null;
  const [head, ...rest] = evidence.split(' — ');
  if (head.trim() !== figure.trim() || !rest.length) return null;
  return rest.join(' — ');
}

function ProofCard({ test }) {
  const showFigure = test.figure && isNumericFigure(test.figure);
  const continuation = showFigure ? splitEvidence(test.evidence, test.figure) : null;
  return (
    <div style={{ flex: 1, border: '1px solid var(--deck-color-ink)', boxSizing: 'border-box', padding: '16px 14px 10px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--deck-color-ink)', lineHeight: 1.25, marginBottom: 5 }}>
        {test.title}
      </div>
      <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8.8, color: 'var(--deck-color-ink)', lineHeight: 1.4, marginBottom: 6 }}>
        {test.body}
      </div>
      {showFigure ? (
        <div style={{ marginBottom: continuation ? 6 : 4 }}>
          <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {test.figure}
          </span>
          {continuation ? (
            <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8.25, color: 'var(--deck-color-ink)', lineHeight: 1.35 }}> — {continuation}</span>
          ) : null}
        </div>
      ) : null}
      {test.imageUrl ? (
        <div style={{ flex: 1, minHeight: 0, border: '1px solid var(--deck-color-ink)', overflow: 'hidden', marginTop: 'auto' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={test.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)' }} />
        </div>
      ) : null}
      {!continuation && test.evidence ? (
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8.25, color: 'var(--deck-color-ink)', lineHeight: 1.35, marginTop: 5 }}>
          {test.evidence}
        </div>
      ) : null}
    </div>
  );
}

function WhyNowCard({ item }) {
  // Arrows carried over from the source PDFs (↑↓→) are stripped at
  // render time, never edited out of the data itself — see mapFromTheses.js.
  const label = (item.label || '').replace(/[↑↓→]/g, '').trim();
  return (
    <div style={{ flex: 1, position: 'relative', border: '1px solid var(--deck-color-ink)', boxSizing: 'border-box', padding: '24px 16px 14px' }}>
      <div style={{ position: 'absolute', top: -11, left: 14, background: 'var(--deck-color-crimson)', padding: '4px 10px' }}>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#efefef', lineHeight: 1.2 }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1.3, marginBottom: 3 }}>
        {item.value}
      </div>
      <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8.25, color: 'var(--deck-color-ink)', lineHeight: 1.35 }}>{item.body}</div>
      {item.source ? (
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 6.5, color: 'rgba(54,54,54,0.55)', lineHeight: 1.3, marginTop: 4 }}>{item.source}</div>
      ) : null}
    </div>
  );
}

export function SectorTestsSlide({ eyebrow, title, tests = [], whyNow = [], notFund, changeView }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', top: 20, left: 36, background: 'var(--deck-color-crimson)', padding: '4px 10px' }}>
        <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#efefef', lineHeight: 1.2 }}>
          {eyebrow}
        </span>
      </div>
      <div style={{ position: 'absolute', left: 36, top: 52, right: 36, fontFamily: 'var(--deck-font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1.18, letterSpacing: '-0.01em' }}>
        {renderHighlighted(title)}
      </div>

      <div style={{ position: 'absolute', left: 36, right: 36, top: 100, height: 230, display: 'flex', gap: 20 }}>
        {tests.map((t) => (
          <ProofCard key={t.title} test={t} />
        ))}
      </div>

      <div style={{ position: 'absolute', left: 36, right: 36, top: 350, height: 100, display: 'flex', gap: 20 }}>
        {whyNow.map((w) => (
          <WhyNowCard key={w.label} item={w} />
        ))}
      </div>

      <div style={{ position: 'absolute', left: 36, right: 96, bottom: 14, display: 'flex', gap: 36 }}>
        {notFund ? (
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 8, fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '0.08em' }}>WE WILL NOT FUND</span>
            <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8.25, color: 'var(--deck-color-ink)' }}>: {notFund}</span>
          </div>
        ) : null}
        {changeView ? (
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 8, fontWeight: 700, color: 'var(--deck-color-crimson)', letterSpacing: '0.08em' }}>WHAT WOULD CHANGE OUR VIEW</span>
            <span style={{ fontFamily: 'var(--deck-font-body)', fontSize: 8.25, color: 'var(--deck-color-ink)' }}>: {changeView}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
