import { requireTeamUser } from '@/decks/auth';
import { supa } from '@/lib/lp-data/rest';
import { isYaliStaff } from '@/lib/internal-user';
import { SignOutButton } from '../_components/SignOutButton';
import { Breadcrumbs, TEAM } from '../_components/Breadcrumbs';
import t from '../travel/travel.module.css';
import s from './usage.module.css';
import { AutoRefresh } from './AutoRefresh';

export const metadata = { title: 'Portal usage | Yali Team', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// LP portal analytics, laid out like a standard analytics page: a date range, headline
// numbers against the previous period, visits over time, when LPs come and how they
// rate the portal, then the LP table and recent activity. Read from Supabase
// `portal_visits` (rules in supabase/migrations/0007_portal_visits.sql); Yali staff
// visits are left out. Charts are plain server-rendered SVG with a hover title per bar.
// Data is sparse for now, so every block reads sensibly with little or nothing in it.

const TZ = 'Asia/Kolkata';
const RANGES = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['all', 'All time']];
const DAY_MS = 86400000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const istDay = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
const istWeekday = (d) => (new Date(new Date(d).toLocaleString('en-US', { timeZone: TZ })).getDay() + 6) % 7; // Mon = 0
const shortDay = (ymd) => new Date(`${ymd}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });

function ago(iso, now) {
  const m = Math.round((now - new Date(iso)) / 60000);
  if (m < 60) return m <= 1 ? 'just now' : `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

function duration(seconds) {
  if (!seconds) return '0 min';
  if (seconds < 60) return 'Under 1 min';
  const mins = Math.round(seconds / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

// `companies` (slugs of company pages opened) arrives with
// supabase/migrations/0009_portal_visit_companies.sql; until then visits load without it.
async function loadVisits() {
  const base = 'email,started_at,active_seconds,downloaded,rating';
  const q = (cols) => supa(`/rest/v1/portal_visits?select=${cols}&is_staff=eq.false&order=started_at.desc&limit=5000`);
  const { rows } = await q(`${base},companies`).catch(() => q(base));
  return (rows || []).map((v) => ({ ...v, companies: v.companies || [] }));
}

const docs = async (type, cols) => {
  try {
    return (await supa(`/rest/v1/sanity_docs?select=${cols}&type=eq.${type}&limit=5000`)).rows || [];
  } catch {
    return [];
  }
};

// Portal user records (names, who has access), company names, every download (logged
// since June 2026, before visits were tracked) and every rating with its comment.
async function loadRecords() {
  const [users, companies, downloads, feedback] = await Promise.all([
    docs('portalUser', 'email:doc->>email,name:doc->>name,noAccess:doc->noAccess,lpPortalAccess:doc->lpPortalAccess,isActive:doc->isActive,gift:doc->isGiftCityLP'),
    docs('company', 'slug:doc->slug->>current,name:doc->>name'),
    docs('lpDownloadConsent', 'email:doc->>email,type:doc->>downloadType,quarter:doc->>reportQuarter,at:doc->>consentedAt'),
    docs('lpPortalFeedback', 'email:doc->>email,score:doc->npsScore,quarter:doc->>reportQuarter,comment:doc->>feedbackDetails,at:doc->>submittedAt'),
  ]);
  const lp = (r) => r.email && !isYaliStaff(r.email);
  return {
    users: dedupeUsers(users.filter(lp)),
    companyNames: new Map(companies.filter((c) => c.slug).map((c) => [c.slug, c.name || c.slug])),
    downloads: downloads.filter((d) => lp(d) && FILES[d.type]).map((d) => ({ ...d, email: d.email.toLowerCase() })).sort((a, b) => new Date(b.at) - new Date(a.at)),
    feedback: feedback.filter(lp).map((f) => ({ ...f, email: f.email.toLowerCase() })).sort((a, b) => new Date(b.at) - new Date(a.at)),
  };
}

// One row per email: some LPs have two records. Access if either record grants it; keep a name.
function dedupeUsers(users) {
  const map = new Map();
  for (const u of users) {
    const email = u.email.toLowerCase();
    const prev = map.get(email);
    map.set(email, prev && hasPortalAccess(prev) && !hasPortalAccess(u)
      ? { ...prev, name: prev.name || u.name }
      : { ...u, email, name: u.name || prev?.name || null, gift: u.gift === true || prev?.gift === true });
  }
  return [...map.values()];
}

const FILES = { 'quarterly-report': 'Report', 'fund-financials': 'Fund financials', 'fund-financials-gift-city': 'GIFT City financials' };
// Same rule as sign-in (lpPortalActive in src/lib/lp-data/supabase-reads.js).
const hasPortalAccess = (u) => u.noAccess !== true && (u.lpPortalAccess === true || (u.lpPortalAccess == null && u.isActive === true));
const TRACKING_FROM = '11 Nov 2026';
const TRACKING_DAY = '2026-11-11'; // the same day as an IST day key

function summarise(visits) {
  const lps = new Set(visits.map((v) => v.email));
  const seconds = visits.reduce((n, v) => n + v.active_seconds, 0);
  const downloaders = new Set(visits.filter((v) => v.downloaded).map((v) => v.email));
  const ratings = visits.filter((v) => v.rating != null).map((v) => v.rating);
  return {
    lps: lps.size,
    visits: visits.length,
    seconds,
    avgSeconds: visits.length ? seconds / visits.length : 0,
    downloadRate: lps.size ? downloaders.size / lps.size : null,
    downloaders: downloaders.size,
    avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    ratings,
  };
}

function byLp(visits, names) {
  const map = new Map();
  for (const v of visits) { // newest first, so the first visit seen per LP is their latest
    const lp = map.get(v.email) || { email: v.email, name: names.get(v.email) || null, visits: 0, seconds: 0, downloaded: false, rating: null, last: v.started_at, companies: new Map() };
    lp.visits += 1;
    lp.seconds += v.active_seconds;
    lp.downloaded ||= v.downloaded;
    if (lp.rating == null && v.rating != null) lp.rating = v.rating;
    for (const c of v.companies) lp.companies.set(c, (lp.companies.get(c) || 0) + 1);
    map.set(v.email, lp);
  }
  return [...map.values()].sort((a, b) => b.seconds - a.seconds || new Date(b.last) - new Date(a.last));
}

// "Up 3", "Down 2 min", "Up 5 pts" or "Same"; read as "… from the 7 days before"
function delta(cur, prev, { pct = false, unit = '' } = {}) {
  if (prev == null || cur == null) return null;
  const d = pct ? Math.round((cur - prev) * 100) : cur - prev;
  if (d === 0) return 'Same';
  const size = pct ? `${Math.abs(d)} pts` : unit === 'min' ? duration(Math.abs(d)) : Math.abs(Math.round(d * 10) / 10);
  return `${d > 0 ? 'Up' : 'Down'} ${size}`;
}

// Single-series bar chart, SVG. Bars are square (Yali), one crimson, with a native hover title.
function Bars({ data, label, width = 640, height = 160, valueLabel = (v) => v, xLabel = (k) => k, every = 1 }) {
  const W = width, H = height, padL = 28, padB = 22, padT = 8;
  const barMax = 36; // a few days of data must not turn into slabs
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = max <= 4 ? [...Array(max + 1).keys()] : [0, Math.round(max / 2), max];
  const bw = (W - padL) / data.length;
  const y = (v) => padT + (H - padT - padB) * (1 - v / max);
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <svg className={s.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${total} in total`}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={padL} x2={W} y1={y(v)} y2={y(v)} className={s.grid} />
          <text x={padL - 6} y={y(v) + 3} className={s.axis} textAnchor="end">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + i * bw;
        const h = H - padB - y(d.value);
        return (
          <g key={d.key}>
            <rect x={x} y={padT} width={bw} height={H - padT - padB} className={s.hit}><title>{`${xLabel(d.key)}: ${valueLabel(d.value)}`}</title></rect>
            {d.value > 0 && (() => { const w = Math.max(1, Math.min(barMax, bw - Math.min(4, bw * 0.3))); return <rect x={x + (bw - w) / 2} y={y(d.value)} width={w} height={h} className={s.bar} pointerEvents="none" />; })()}
            {i % every === 0 && <text x={x + bw / 2} y={H - 6} className={s.axis} textAnchor="middle">{xLabel(d.key)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default async function PortalUsage({ searchParams }) {
  const email = await requireTeamUser('usage');
  const sp = await searchParams;
  const range = RANGES.some(([k]) => k === sp?.range) ? sp.range : '30';

  let all = [];
  let rec = { users: [], companyNames: new Map(), downloads: [], feedback: [] };
  let failed = false;
  try {
    [all, rec] = await Promise.all([loadVisits(), loadRecords()]);
  } catch {
    failed = true;
  }
  const names = new Map(rec.users.map((u) => [u.email, u.name || null]));
  const companyName = (slug) => rec.companyNames.get(slug) || slug;
  const who = (e) => names.get(e) || e;

  const now = Date.now();
  const today = istDay(now);
  const first = all.length ? istDay(all[all.length - 1].started_at) : today;
  const days = range === 'all' // at least a week, so a young dataset still reads as a timeline
    ? Math.max(7, Math.round((new Date(`${today}T00:00:00`) - new Date(`${first}T00:00:00`)) / DAY_MS) + 1)
    : Number(range);
  const startDay = istDay(now - (days - 1) * DAY_MS);
  const prevStartDay = istDay(now - (2 * days - 1) * DAY_MS);
  const inRange = all.filter((v) => istDay(v.started_at) >= startDay);
  const prev = range === 'all' ? null : all.filter((v) => { const d = istDay(v.started_at); return d >= prevStartDay && d < startDay; });

  const cur = summarise(inRange);
  // Compare only when the whole earlier stretch falls after tracking began; before
  // that there is no data, which is not the same as no visits.
  const was = prev && prevStartDay >= TRACKING_DAY ? summarise(prev) : null;
  const vs = (d) => (d === 'Same' ? `Same as the ${days} days before` : `${d} from the ${days} days before`);

  const kpis = [
    { label: 'Active LPs', value: cur.lps, d: was && delta(cur.lps, was.lps) },
    { label: 'Visits', value: cur.visits, d: was && delta(cur.visits, was.visits) },
    { label: 'Avg time per visit', value: cur.visits ? duration(cur.avgSeconds) : '–', d: was && cur.visits && was.visits && delta(cur.avgSeconds, was.avgSeconds, { unit: 'min' }) },
    { label: 'Total time on portal', value: duration(cur.seconds), d: was && delta(cur.seconds, was.seconds, { unit: 'min' }) },
    { label: 'Downloaded a report', value: cur.downloadRate == null ? '–' : `${Math.round(cur.downloadRate * 100)}%`, sub: cur.lps ? `${cur.downloaders} of ${cur.lps} LP${cur.lps === 1 ? '' : 's'}` : null, d: was && delta(cur.downloadRate, was.downloadRate, { pct: true }) },
    { label: 'Avg rating', value: cur.avgRating == null ? '–' : `${cur.avgRating.toFixed(1)} / 10`, sub: cur.ratings.length ? `${cur.ratings.length} rating${cur.ratings.length === 1 ? '' : 's'}` : 'No ratings yet', d: was && cur.avgRating != null && was.avgRating != null ? delta(cur.avgRating, was.avgRating) : null },
  ];

  // visits per day across the range (IST days)
  const perDay = new Map();
  for (let i = days - 1; i >= 0; i--) perDay.set(istDay(now - i * DAY_MS), 0);
  for (const v of inRange) { const k = istDay(v.started_at); if (perDay.has(k)) perDay.set(k, perDay.get(k) + 1); }
  const daySeries = [...perDay].map(([key, value]) => ({ key, value }));
  const weekday = WEEKDAYS.map((key) => ({ key, value: 0 }));
  for (const v of inRange) weekday[istWeekday(v.started_at)].value += 1;
  const ratingDist = [...Array(11).keys()].map((n) => ({ key: String(n), value: cur.ratings.filter((r) => r === n).length }));

  const lps = byLp(inRange, names);
  const recent = inRange.slice(0, 12);
  const rangeLabel = RANGES.find(([k]) => k === range)[1].toLowerCase();
  const inDays = (iso) => range === 'all' || istDay(iso) >= startDay;

  // downloads, by file and quarter
  const downloads = rec.downloads.filter((d) => inDays(d.at));
  const fileMap = new Map();
  for (const d of downloads) {
    const k = `${d.quarter || ''}|${d.type}`;
    const f = fileMap.get(k) || { quarter: d.quarter || '', type: d.type, lps: new Set(), count: 0 };
    f.lps.add(d.email);
    f.count += 1;
    fileMap.set(k, f);
  }
  const fileOrder = Object.keys(FILES);
  const qKey = (q) => { const m = /Q(\d) FY(\d+)/.exec(q); return m ? Number(m[2]) * 10 + Number(m[1]) : 0; };
  const byFile = [...fileMap.values()].sort((a, b) => qKey(b.quarter) - qKey(a.quarter) || fileOrder.indexOf(a.type) - fileOrder.indexOf(b.type));

  // company pages opened (each visit counts a company once)
  const compMap = new Map();
  for (const v of inRange) for (const c of v.companies) {
    const x = compMap.get(c) || { slug: c, lps: new Set(), visits: 0 };
    x.lps.add(v.email);
    x.visits += 1;
    compMap.set(c, x);
  }
  const companiesOpened = [...compMap.values()].sort((a, b) => b.lps.size - a.lps.size || b.visits - a.visits);

  const comments = rec.feedback.filter((f) => f.comment && f.comment.trim() && inDays(f.at));

  // LPs with portal access and no visit since tracking began (all time, whatever the range)
  const seen = new Set(all.map((v) => v.email));
  const lastDownload = new Map();
  for (const d of rec.downloads) if (!lastDownload.has(d.email)) lastDownload.set(d.email, d); // newest first
  const notSignedIn = rec.users.filter((u) => hasPortalAccess(u) && !seen.has(u.email))
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

  return (
    <div className={t.page}>
      <AutoRefresh />
      <div className={t.bar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/team/"><img src="/favicon.svg" alt="Yali" /></a>
        <span className={t.divider} />
        <span className={t.barTitle}>Portal usage</span>
        <span className={t.barRight}>{email}</span>
        <SignOutButton />
      </div>
      <Breadcrumbs trail={[TEAM, ['Portal usage']]} />
      <main className={`${t.main} ${t.wide}`}>
        <div className={s.head}>
          <div>
            <h1 className={t.h1}>LP portal usage</h1>
            <p className={s.lede}>partners.yali.vc, {rangeLabel}. Time counts only while an LP is active on the page. IST. Yali staff not shown. Tracking began {TRACKING_FROM}.</p>
          </div>
          <nav className={s.ranges} aria-label="Date range">
            {RANGES.map(([k, l]) => (
              <a key={k} href={`?range=${k}`} className={k === range ? s.rangeOn : s.range} aria-current={k === range ? 'page' : undefined}>{l}</a>
            ))}
          </nav>
        </div>

        {failed ? (
          <div className={t.card}><p className={t.empty}>Could not load usage right now. Try again in a minute.</p></div>
        ) : (
          <>
            <div className={s.kpis}>
              {kpis.map((k) => (
                <div key={k.label} className={s.kpi}>
                  <div className={s.kpiLabel}>{k.label}</div>
                  <div className={s.kpiValue}>{k.value}</div>
                  <div className={s.kpiSub}>{k.sub || (k.d ? vs(k.d) : ' ')}</div>
                  {k.sub && k.d ? <div className={s.kpiSub}>{vs(k.d)}</div> : null}
                </div>
              ))}
            </div>

            <section className={t.card}>
              <h2 className={s.h2}>Visits per day</h2>
              {inRange.length ? (
                <Bars data={daySeries} label="Visits per day" xLabel={shortDay} valueLabel={(v) => `${v} visit${v === 1 ? '' : 's'}`} every={Math.max(1, Math.ceil(days / 8))} />
              ) : <p className={t.empty}>No LP visits {rangeLabel}.</p>}
            </section>

            <div className={s.two}>
              <section className={t.card}>
                <h2 className={s.h2}>Visits by day of week</h2>
                {inRange.length ? <Bars data={weekday} label="Visits by day of week" width={380} height={170} valueLabel={(v) => `${v} visit${v === 1 ? '' : 's'}`} /> : <p className={t.empty}>Nothing yet.</p>}
              </section>
              <section className={t.card}>
                <h2 className={s.h2}>Ratings, 0 to 10</h2>
                {cur.ratings.length ? <Bars data={ratingDist} label="Ratings" width={380} height={170} xLabel={(k) => k} valueLabel={(v) => `${v} rating${v === 1 ? '' : 's'}`} /> : <p className={t.empty}>No ratings {rangeLabel}.</p>}
              </section>
            </div>

            <section className={t.card}>
              <h2 className={s.h2}>LPs, by time on portal</h2>
              {lps.length ? (
                <div className={s.scroll}>
                  <table className={s.table}>
                    <thead>
                      <tr><th>LP</th><th className={s.num}>Visits</th><th className={s.num}>Total time</th><th className={s.num}>Avg per visit</th><th>Last seen</th><th>Downloaded</th><th className={s.num}>Latest rating</th><th>Company pages opened</th></tr>
                    </thead>
                    <tbody>
                      {lps.map((l) => (
                        <tr key={l.email}>
                          <td>
                            <div className={s.lpName}>{l.name || l.email}</div>
                            {l.name ? <div className={s.lpEmail}>{l.email}</div> : null}
                          </td>
                          <td className={s.num}>{l.visits}</td>
                          <td className={s.num}>{duration(l.seconds)}</td>
                          <td className={s.num}>{duration(l.seconds / l.visits)}</td>
                          <td>{ago(l.last, now)}<span className={s.muted}>{`  ${when(l.last)}`}</span></td>
                          <td>{l.downloaded ? 'Yes' : <span className={s.muted}>No</span>}</td>
                          <td className={s.num}>{l.rating == null ? <span className={s.muted}>Not rated</span> : `${l.rating} / 10`}</td>
                          <td className={s.wrap}>{l.companies.size ? [...l.companies].map(([c, n]) => (n > 1 ? `${companyName(c)} (${n} visits)` : companyName(c))).join(', ') : <span className={s.muted}>None</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className={t.empty}>No LP has signed in {rangeLabel}.</p>}
            </section>

            <section className={t.card}>
              <h2 className={s.h2}>Company pages opened</h2>
              {companiesOpened.length ? (
                <div className={s.scroll}>
                  <table className={s.table}>
                    <thead><tr><th>Company</th><th className={s.num}>LPs</th><th className={s.num}>Visits</th><th>Opened by</th></tr></thead>
                    <tbody>
                      {companiesOpened.map((c) => (
                        <tr key={c.slug}>
                          <td className={s.lpName}>{companyName(c.slug)}</td>
                          <td className={s.num}>{c.lps.size}</td>
                          <td className={s.num}>{c.visits}</td>
                          <td className={s.wrap}>{[...c.lps].map(who).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className={t.empty}>No company pages opened {rangeLabel}.</p>}
            </section>

            <div className={s.two}>
              <section className={t.card}>
                <h2 className={s.h2}>Downloads, by file</h2>
                {byFile.length ? (
                  <div className={s.scroll}>
                    <table className={s.table}>
                      <thead><tr><th>Quarter</th><th>File</th><th className={s.num}>LPs</th><th className={s.num}>Downloads</th></tr></thead>
                      <tbody>
                        {byFile.map((f) => (
                          <tr key={`${f.quarter}-${f.type}`}>
                            <td>{f.quarter || <span className={s.muted}>Unknown</span>}</td>
                            <td>{FILES[f.type]}</td>
                            <td className={s.num}>{f.lps.size}</td>
                            <td className={s.num}>{f.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className={t.empty}>No downloads {rangeLabel}.</p>}
              </section>
              <section className={t.card}>
                <h2 className={s.h2}>Latest downloads</h2>
                {downloads.length ? (
                  <ul className={s.feed}>
                    {downloads.slice(0, 12).map((d, i) => (
                      <li key={`${d.email}-${d.at}-${i}`}>
                        <span className={s.feedWho}>{who(d.email)}</span>
                        <span>{` ${FILES[d.type]}${d.quarter ? `, ${d.quarter}` : ''}`}</span>
                        <span className={s.feedWhen}>{ago(d.at, now)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className={t.empty}>Nothing {rangeLabel}.</p>}
              </section>
            </div>

            <section className={t.card}>
              <h2 className={s.h2}>Rating comments</h2>
              {comments.length ? (
                <ul className={s.feed}>
                  {comments.map((f, i) => (
                    <li key={`${f.email}-${f.at}-${i}`} className={s.comment}>
                      <div>
                        <span className={s.feedWho}>{who(f.email)}</span>
                        <span>{` rated ${f.score} / 10${f.quarter ? `, ${f.quarter}` : ''}`}</span>
                        <p className={s.commentText}>{f.comment}</p>
                      </div>
                      <span className={s.feedWhen}>{ago(f.at, now)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className={t.empty}>No comments {rangeLabel}. LPs are asked for one when they rate the portal below 7.</p>}
            </section>

            <section className={t.card}>
              <h2 className={s.h2}>Not signed in yet</h2>
              <p className={s.lede}>
                {notSignedIn.length} of {rec.users.filter(hasPortalAccess).length} LPs with portal access have not signed in since tracking began on {TRACKING_FROM}.
                Firms let in by email domain are not listed.
              </p>
              {notSignedIn.length > 0 && (
                <details className={s.more}>
                  <summary>Show the list</summary>
                  <div className={s.scroll}>
                    <table className={s.table}>
                      <thead><tr><th>LP</th><th>GIFT City</th><th>Last download</th></tr></thead>
                      <tbody>
                        {notSignedIn.map((u) => {
                          const d = lastDownload.get(u.email);
                          return (
                            <tr key={u.email}>
                              <td>
                                <div className={s.lpName}>{u.name || u.email}</div>
                                {u.name ? <div className={s.lpEmail}>{u.email}</div> : null}
                              </td>
                              <td>{u.gift === true ? 'Yes' : <span className={s.muted}>No</span>}</td>
                              <td>{d ? `${FILES[d.type]}${d.quarter ? `, ${d.quarter}` : ''}, ${when(d.at)}` : <span className={s.muted}>Never</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </section>

            <section className={t.card}>
              <h2 className={s.h2}>Recent activity</h2>
              {recent.length ? (
                <ul className={s.feed}>
                  {recent.map((v) => (
                    <li key={`${v.email}-${v.started_at}`}>
                      <span className={s.feedWho}>{who(v.email)}</span>
                      <span>
                        {` signed in, ${duration(v.active_seconds)} on the portal`}
                        {v.companies.length ? `, opened ${v.companies.map(companyName).join(', ')}` : ''}
                        {v.downloaded ? ', downloaded a file' : ''}
                        {v.rating != null ? `, rated it ${v.rating} / 10` : ''}
                      </span>
                      <span className={s.feedWhen}>{ago(v.started_at, now)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className={t.empty}>Nothing {rangeLabel}.</p>}
            </section>
          </>
        )}
      </main>
      <Breadcrumbs trail={[TEAM, ['Portal usage']]} position="bottom" />
    </div>
  );
}
