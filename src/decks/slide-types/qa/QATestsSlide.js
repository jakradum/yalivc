// Theses deck, inner page 2 of 2 (Q&A layout): what makes a company
// defensible, why now, what we will not fund, what would change our mind.
// Same props as the old SectorTestsSlide.
import { QASlide, AList, Muted } from './qaShared';

// "$234M — raised by Sarvam..." renders as "$234M raised by Sarvam...":
// the figure stays attached to its explanation, with no dash. A numeric
// figure the evidence doesn't open with ("<$6,000" before "Perceptyne
// builds...") is set in front of it, as the old proof card showed it above.
// A figure that isn't numeric ("ACQUIRED") is never shown, as before; the
// evidence reads as written.
function Evidence({ test }) {
  const ev = test.evidence || '';
  const [head, ...rest] = ev.split(' — ');
  const numeric = test.figure && /\d/.test(test.figure);
  if (numeric && head.trim().toLowerCase() === test.figure.trim().toLowerCase() && rest.length) {
    return (
      <Muted>
        {' '}
        <b style={{ color: 'var(--deck-color-crimson)' }}>{head.trim()}</b> {rest.join(', ')}
      </Muted>
    );
  }
  return (
    <Muted>
      {' '}
      {numeric ? <b style={{ color: 'var(--deck-color-crimson)' }}>{test.figure} </b> : null}
      {ev.split(' — ').join(': ')}
    </Muted>
  );
}

const clean = (s) => (s || '').replace(/[↑↓→]/g, '').trim();

// Why-now sources are mostly written to continue the figure ("70%
// imported" + "of India's medical device consumption, FY24"), so a
// lowercase source runs straight on; anything else follows a comma.
function WhySource({ source }) {
  const src = clean(source);
  if (!src) return '.';
  const joined = /^[a-z]/.test(src) ? ` ${src}` : `, ${src}`;
  return <Muted>{joined.endsWith('.') ? joined : `${joined}.`}</Muted>;
}

export function QATestsSlide({ title, tests = [], whyNow = [], notFund, changeView }) {
  const qa = [];
  if (tests.length) {
    qa.push({
      q: 'What makes a company defensible?',
      list: true,
      items: tests.map((t) => t.title.length + t.body.length + (t.evidence || '').length + (/\d/.test(t.figure || '') ? t.figure.length + 1 : 0) + 3),
      a: (
        <AList
          ordered
          items={tests.map((t) => (
            <>
              <b>{t.title}.</b> {t.body}
              <Evidence test={t} />
            </>
          ))}
        />
      ),
    });
  }
  if (whyNow.length) {
    qa.push({
      q: 'Why now?',
      list: true,
      items: whyNow.map((w) => clean(w.label).length + w.value.length + w.body.length + (w.source || '').length + 5),
      a: (
        <AList
          items={whyNow.map((w) => (
            <>
              <Muted>{clean(w.label)}:</Muted> <b>{w.value}</b>
              <WhySource source={w.source} /> {w.body}
            </>
          ))}
        />
      ),
    });
  }
  if (notFund) qa.push({ q: 'What will you not fund?', items: [notFund.length], a: notFund });
  if (changeView) qa.push({ q: 'What would change your mind?', items: [changeView.length], a: changeView });
  return <QASlide title={title} rows={qa} />;
}
