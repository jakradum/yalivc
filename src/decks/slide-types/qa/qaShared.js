// Shared pieces for the theses deck's Q&A layout: each inner slide is a
// stack of question/answer rows under one headline. Questions sit in a
// fixed left column (mono, crimson), answers on the right. Sectors carry
// very different amounts of text (Robotics has ~50% more than AI), so
// answer type steps down by content length instead of every sector being
// hand-tuned.

export const QUESTION_COL = 250;

// Backticked phrase in a title renders in crimson (the old gold marker
// was dropped with the graphic treatment). RegExp built from a string:
// a backtick inside a regex literal hangs Babel here.
export function renderTitle(text) {
  if (!text) return text;
  return text.split(new RegExp('(`[^`]+`)')).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <span key={i} style={{ color: 'var(--deck-color-crimson)' }}>
        {part.slice(1, -1)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Type size is picked per slide by estimating how the answers wrap,
// largest size first, so a sparse sector reads large and a dense one
// still fits. Each row passes `items`: the character length of each
// paragraph or list item in its answer. Constants are calibrated against
// measured renders of the real fixture (Inter / JetBrains Mono).
const SIZES = [12.2, 11.6, 11.2, 10.7, 10.2, 9.8];
const SLIDE_W = 960;
const PAD_X = 44;
const BUDGET = 486; // lowest text line allowed, px from the top (page number sits below)
const ANSWER_W = SLIDE_W - PAD_X * 2 - QUESTION_COL - 28;
const CHAR_W = 0.48; // Inter average advance, in em
const MONO_W = 0.6; // JetBrains Mono advance, in em

const lines = (chars, width, size, em) => Math.max(1, Math.ceil((chars * size * em) / width));
const rowPad = (size) => (size > 11.5 ? 12 : size > 10.5 ? 9 : 7);
const qSize = (size) => (size > 12 ? 16.5 : size > 10.5 ? 15.5 : 14.5);
const lineH = (size) => (size < 10.5 ? 1.42 : 1.48);

function estimate(title, rows, size) {
  const titleLines = lines(title.replace(/`/g, '').length, SLIDE_W - PAD_X * 2 - 70, 21, MONO_W);
  let y = 30 + titleLines * 21 * 1.25 + 12 + 1.5;
  for (const r of rows) {
    const indent = r.list ? 16 : 0;
    const ansLines = r.items.reduce((n, c) => n + lines(c, ANSWER_W - indent, size, CHAR_W), 0);
    const ansH = ansLines * size * lineH(size) + r.items.length * (r.list ? 2 : 0);
    const qH = lines(r.q.length, QUESTION_COL, qSize(size), MONO_W) * qSize(size) * 1.3;
    y += Math.max(ansH, qH) + rowPad(size) * 2 + 0.5;
  }
  return y;
}

export function fitSize(title, rows) {
  return SIZES.find((s) => estimate(title || '', rows, s) <= BUDGET) || SIZES[SIZES.length - 1];
}

export function QASlide({ title, rows }) {
  const size = fitSize(title, rows);
  return (
    <div style={{ width: '100%', height: '100%', padding: '30px 44px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 21, fontWeight: 700, lineHeight: 1.25, color: 'var(--deck-color-ink)', paddingBottom: 12, paddingRight: 70, borderBottom: '1.5px solid var(--deck-color-ink)', flexShrink: 0 }}>
        {renderTitle(title)}
      </div>
      {rows.map((r) => (
        <div key={r.q} style={{ display: 'grid', gridTemplateColumns: `${QUESTION_COL}px 1fr`, gap: 28, padding: `${rowPad(size)}px 0`, borderBottom: '0.5px solid rgba(54,54,54,0.22)' }}>
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontWeight: 700, fontSize: qSize(size), lineHeight: 1.3, color: 'var(--deck-color-crimson)', letterSpacing: '-0.01em' }}>{r.q}</div>
          <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: size, lineHeight: lineH(size), color: 'var(--deck-color-ink)' }}>{r.a}</div>
        </div>
      ))}
    </div>
  );
}

export const Muted = ({ children }) => <span style={{ color: 'rgba(54,54,54,0.72)' }}>{children}</span>;

// Bulleted / numbered answer list.
export function AList({ items, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag style={{ margin: 0, paddingLeft: 16 }}>
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: 2 }}>
          {it}
        </li>
      ))}
    </Tag>
  );
}
