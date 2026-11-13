import { requireTeamUser } from '@/decks/auth';
import { supa } from '@/lib/lp-data/rest';
import { SignOutButton } from '../builder/SignOutButton';
import t from '../travel/travel.module.css';
import s from './usage.module.css';

export const metadata = { title: 'Portal usage | Yali Team', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// LP portal usage, read from Supabase `portal_visits` (rules in
// supabase/migrations/0007_portal_visits.sql). Yali staff visits are left out.
// Most fields stay empty for a while (few downloads, fewer ratings), so every
// column reads sensibly when nothing has come in.

const when = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata',
  });

function duration(seconds) {
  if (seconds < 60) return 'Under 1 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

const Muted = ({ children }) => <span className={s.muted}>{children}</span>;
const Rating = ({ value }) => (value == null ? <Muted>Not rated</Muted> : <>{value} / 10</>);
const Downloaded = ({ value }) => (value ? 'Yes' : <Muted>No</Muted>);

async function loadVisits() {
  const { rows } = await supa(
    '/rest/v1/portal_visits?select=email,started_at,active_seconds,downloaded,rating&is_staff=eq.false&order=started_at.desc&limit=2000'
  );
  return rows || [];
}

function byLp(visits) {
  const map = new Map();
  for (const v of visits) {
    // visits arrive newest first, so the first one seen per LP is their latest
    const lp = map.get(v.email) || { email: v.email, visits: 0, seconds: 0, downloaded: false, rating: null, last: v.started_at };
    lp.visits += 1;
    lp.seconds += v.active_seconds;
    lp.downloaded ||= v.downloaded;
    if (lp.rating == null && v.rating != null) lp.rating = v.rating;
    map.set(v.email, lp);
  }
  return [...map.values()];
}

export default async function PortalUsage() {
  const email = await requireTeamUser('usage');
  let visits = [];
  let failed = false;
  try {
    visits = await loadVisits();
  } catch {
    failed = true;
  }
  const lps = byLp(visits);
  const totalSeconds = visits.reduce((n, v) => n + v.active_seconds, 0);
  const downloaders = lps.filter((l) => l.downloaded).length;
  const ratings = visits.filter((v) => v.rating != null).map((v) => v.rating);
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  const stats = [
    ['LPs signed in', lps.length],
    ['Visits', visits.length],
    ['Time on portal', visits.length ? duration(totalSeconds) : <Muted>None yet</Muted>],
    ['Downloaded a report', downloaders ? `${downloaders} of ${lps.length} LPs` : <Muted>None yet</Muted>],
    ['Average rating', avg ? `${avg} / 10 (${ratings.length})` : <Muted>None yet</Muted>],
  ];

  return (
    <div className={t.page}>
      <div className={t.bar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/team/"><img src="/favicon.svg" alt="Yali" /></a>
        <span className={t.divider} />
        <span className={t.barTitle}>Portal usage</span>
        <span className={t.barRight}>{email}</span>
        <SignOutButton />
      </div>
      <main className={`${t.main} ${t.wide}`}>
        <h1 className={t.h1}>LP portal usage</h1>
        <p className={t.lede}>
          Who signed in to partners.yali.vc, how long they stayed, and whether they downloaded a report or rated the portal.
          Time counts only while the LP is active on the page. Times are IST. Yali staff are not shown.
        </p>

        {failed ? (
          <div className={t.card}><p className={t.empty}>Could not load usage right now. Try again in a minute.</p></div>
        ) : (
          <>
            <div className={s.stats}>
              {stats.map(([label, value]) => (
                <div key={label} className={s.stat}>
                  <div className={s.statValue}>{value}</div>
                  <div className={s.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            <section className={t.card}>
              <h2 className={s.h2}>By LP</h2>
              {lps.length ? (
                <div className={s.scroll}>
                  <table className={s.table}>
                    <thead>
                      <tr><th>LP</th><th className={s.num}>Visits</th><th>Last signed in</th><th className={s.num}>Total time</th><th>Downloaded</th><th>Latest rating</th></tr>
                    </thead>
                    <tbody>
                      {lps.map((l) => (
                        <tr key={l.email}>
                          <td className={s.lp}>{l.email}</td>
                          <td className={s.num}>{l.visits}</td>
                          <td>{when(l.last)}</td>
                          <td className={s.num}>{duration(l.seconds)}</td>
                          <td><Downloaded value={l.downloaded} /></td>
                          <td><Rating value={l.rating} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className={t.empty}>No LP has signed in yet.</p>}
            </section>

            {visits.length > 0 && (
              <section className={t.card}>
                <h2 className={s.h2}>All visits</h2>
                <div className={s.scroll}>
                  <table className={s.table}>
                    <thead>
                      <tr><th>LP</th><th>Signed in</th><th className={s.num}>Time</th><th>Downloaded</th><th>Rating</th></tr>
                    </thead>
                    <tbody>
                      {visits.map((v) => (
                        <tr key={`${v.email}-${v.started_at}`}>
                          <td className={s.lp}>{v.email}</td>
                          <td>{when(v.started_at)}</td>
                          <td className={s.num}>{duration(v.active_seconds)}</td>
                          <td><Downloaded value={v.downloaded} /></td>
                          <td><Rating value={v.rating} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
