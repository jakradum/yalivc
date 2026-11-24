// Theses deck, inner page 1 of 2 (Q&A layout): where we search, where we
// are selective, what we watch, what we pass on, and what drives the
// market. Takes the same props as the old SectorMapSlide (`rows`,
// `footers`, `title`), plus `notInvesting` for Other Deep Tech, whose
// "not investing" boundary is a separate field rather than a row.
import { QASlide, AList, Muted } from './qaShared';

const QUESTIONS = [
  { q: 'Where are you searching hardest?', positions: ['active'] },
  { q: 'Where are you selective?', positions: ['selective'] },
  { q: 'What are you watching?', positions: ['tracking', 'watching'] },
];

const hasLeader = (r) => r.leader && r.leader.trim() !== '—';

function Names({ row }) {
  const india = (row.others || []).map((o, i) =>
    o.portfolio ? (
      <b key={i} style={{ color: 'var(--deck-color-crimson)' }}>
        {o.text}
      </b>
    ) : (
      <span key={i}>{o.text}</span>
    )
  );
  if (!hasLeader(row) && !india.length) return null;
  return (
    <Muted>
      {' '}
      {hasLeader(row) ? `Leader: ${row.leader}.` : null}
      {india.length ? <> India: {india}.</> : null}
    </Muted>
  );
}

const rowChars = (r) => (r.segment || '').length + (r.decides || '').length + (hasLeader(r) ? r.leader.length + 9 : 0) + (r.others || []).reduce((s, o) => s + o.text.length, 0) + 8;

export function QAMapSlide({ title, rows = [], notInvesting, footers = [] }) {
  const all = notInvesting ? [...rows, { ...notInvesting, position: 'none' }] : rows;
  const qa = [];
  for (const { q, positions } of QUESTIONS) {
    const rs = all.filter((r) => positions.includes(r.position));
    if (!rs.length) continue;
    qa.push({
      q,
      list: true,
      items: rs.map(rowChars),
      a: (
        <AList
          items={rs.map((r) => (
            <>
              <b>{r.segment}.</b> {r.decides}
              <Names row={r} />
            </>
          ))}
        />
      ),
    });
  }
  const pass = all.filter((r) => r.position === 'none');
  if (pass.length) {
    qa.push({
      q: 'What do you pass on?',
      items: pass.map(rowChars),
      a: pass.map((r) => (
        <div key={r.segment}>
          <b>{r.segment}.</b> {r.decides}
        </div>
      )),
    });
  }
  if (footers.length) {
    qa.push({
      q: 'What is driving it?',
      items: footers.map((f) => f.label.length + f.text.length + 2),
      a: footers.map((f) => (
        <div key={f.label} style={{ marginBottom: 2 }}>
          <b>{f.label}:</b> {f.text}
        </div>
      )),
    });
  }
  return <QASlide title={title} rows={qa} />;
}
