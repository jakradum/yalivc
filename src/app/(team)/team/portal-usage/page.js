import { requireTeamUser } from '@/decks/auth';
import { supa } from '@/lib/lp-data/rest';
import { isYaliStaff } from '@/lib/internal-user';
import { SignOutButton } from '../_components/SignOutButton';
import s from './usage.module.css';
import o from './dashboard.module.css';
import { ScrollX } from './ScrollX';
import { ThemeSwitch, THEME_SCRIPT } from './ThemeSwitch';
import { AutoRefresh } from './AutoRefresh';
import { LpTable } from './LpTable';

export const metadata = { title: 'Portal usage | Yali Team', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// LP portal analytics as a dense internal tool: a date range, headline numbers, a
// sortable LP table, a collapsible activity log, LPs not signed in yet, and side panels
// for visits per day, downloads by file, company pages and ratings. Read from Supabase
// `portal_visits` (rules in supabase/migrations/0007_portal_visits.sql) and the LP
// records; Yali staff visits are left out. Day, night or the system setting
// (ThemeSwitch). Data is sparse for now, so every block reads sensibly with little in it.

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
  const filesByLp = new Map(); // what each LP downloaded in the range, oldest first
  for (const d of [...downloads].reverse()) {
    const set = filesByLp.get(d.email) || new Set();
    set.add(`${FILES[d.type]}${d.quarter ? `, ${d.quarter}` : ''}`);
    filesByLp.set(d.email, set);
  }
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
    <div className={o.page} data-ops-page="" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <AutoRefresh />
      <div className={o.bar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/team/" className={o.home}><img src="/favicon.svg" alt="Yali" /><span>Team</span></a>
        <span className={o.crumb}>/</span>
        <span>Portal usage</span>
        <span className={o.barRight}>{email}</span>
        <ThemeSwitch />
        <SignOutButton />
      </div>
      <div className={o.body}>
        <div className={o.top}>
          <h1 className={o.title}>LP portal usage</h1>
          <span className={o.meta}>{rangeLabel[0].toUpperCase() + rangeLabel.slice(1)}. IST. Staff excluded. Tracking since {TRACKING_FROM}. Refreshes every 30 min.</span>
          <nav className={o.ranges} aria-label="Date range">
            {RANGES.map(([k, l]) => (
              <a key={k} href={`?range=${k}`} className={k === range ? o.rangeOn : o.range} aria-current={k === range ? 'page' : undefined}>{l}</a>
            ))}
          </nav>
        </div>

        {failed ? (
          <div className={o.panel}><p className={o.empty}>Could not load usage right now. Try again in a minute.</p></div>
        ) : (
          <>
            <div className={o.stats}>
              {kpis.map((k) => (
                <div key={k.label} className={o.stat}>
                  <span className={o.statLabel}>{k.label}</span>
                  <span className={o.statValue}>{k.value}{k.label === 'Downloaded a report' && cur.lps ? <span className={o.statSub}>{`${cur.downloaders}/${cur.lps}`}</span> : null}</span>
                </div>
              ))}
            </div>

            <div className={o.grid}>
              <div className={o.col}>
                <section className={o.panel}>
                  {lps.length ? (
                    <LpTable
                      rows={lps.map((l) => ({
                        email: l.email,
                        name: l.name,
                        visits: l.visits,
                        seconds: l.seconds,
                        time: duration(l.seconds),
                        avgSeconds: l.seconds / l.visits,
                        avg: duration(l.seconds / l.visits),
                        lastMs: new Date(l.last).getTime(),
                        ago: ago(l.last, now),
                        when: when(l.last),
                        downloaded: l.downloaded,
                        files: [...(filesByLp.get(l.email) || [])],
                        rating: l.rating,
                        companyCount: l.companies.size,
                        companies: [...l.companies].map(([c, n]) => (n > 1 ? `${companyName(c)} (${n})` : companyName(c))).join(', '),
                      }))}
                    />
                  ) : (
                    <>
                      <div className={o.panelHead}><h2 className={o.h2}>LPs</h2><span className={o.count}>0</span></div>
                      <p className={o.empty}>No LP has signed in {rangeLabel}.</p>
                    </>
                  )}
                </section>

                <details className={`${o.panel} ${o.collapse}`}>
                  <summary className={o.panelHead}>
                    <h2 className={o.h2}>Activity log</h2>
                    <span className={o.count}>{inRange.length} visits <span className={o.toggle} data-show="Show" data-hide="Hide" /></span>
                  </summary>
                  {inRange.length ? (
                    <ScrollX>
                      <table className={o.table}>
                        <thead><tr><th>Signed in</th><th>LP</th><th className={o.num}>Time</th><th>Company pages</th><th>Downloaded</th><th className={o.num}>Rating</th></tr></thead>
                        <tbody>
                          {inRange.slice(0, 50).map((v) => (
                            <tr key={`${v.email}-${v.started_at}`}>
                              <td className={o.mono}>{when(v.started_at)}</td>
                              <td>{who(v.email)}</td>
                              <td className={o.num}>{duration(v.active_seconds)}</td>
                              <td className={o.wrap}>{v.companies.length ? v.companies.map(companyName).join(', ') : <span className={o.muted}>None</span>}</td>
                              <td>{v.downloaded ? 'Yes' : <span className={o.muted}>No</span>}</td>
                              <td className={o.num}>{v.rating == null ? <span className={o.muted}>-</span> : v.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollX>
                  ) : <p className={o.empty}>Nothing {rangeLabel}.</p>}
                </details>

                <section className={o.panel}>
                  <div className={o.panelHead}><h2 className={o.h2}>Not signed in yet</h2><span className={o.count}>{notSignedIn.length} of {rec.users.filter(hasPortalAccess).length}</span></div>
                  <p className={o.note}>LPs with portal access and no visit since {TRACKING_FROM}. Firms let in by email domain are not listed.</p>
                  {notSignedIn.length > 0 && (
                    <details className={o.more}>
                      <summary>Show the list</summary>
                      <ScrollX>
                        <table className={o.table}>
                          <thead><tr><th>LP</th><th>Email</th><th>GIFT City</th><th>Last download</th></tr></thead>
                          <tbody>
                            {notSignedIn.map((u) => {
                              const d = lastDownload.get(u.email);
                              return (
                                <tr key={u.email}>
                                  <td className={o.lpName}>{u.name || <span className={o.muted}>No name</span>}</td>
                                  <td className={o.mono}>{u.email}</td>
                                  <td>{u.gift === true ? 'Yes' : <span className={o.muted}>No</span>}</td>
                                  <td>{d ? `${FILES[d.type]}${d.quarter ? `, ${d.quarter}` : ''}, ${when(d.at)}` : <span className={o.muted}>Never</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </ScrollX>
                    </details>
                  )}
                </section>
              </div>

              <div className={o.col}>
                <section className={o.panel}>
                  <div className={o.panelHead}><h2 className={o.h2}>Visits per day</h2><span className={o.count}>{inRange.length}</span></div>
                  {inRange.length ? (
                    <div className={o.chartBox}>
                      <Bars data={daySeries} label="Visits per day" width={420} height={150} xLabel={shortDay} valueLabel={(v) => `${v} visit${v === 1 ? '' : 's'}`} every={Math.max(1, Math.ceil(days / 5))} />
                    </div>
                  ) : <p className={o.empty}>No LP visits {rangeLabel}.</p>}
                </section>

                <section className={o.panel}>
                  <div className={o.panelHead}><h2 className={o.h2}>Downloads, by file</h2><span className={o.count}>{downloads.length}</span></div>
                  {byFile.length ? (
                    <ScrollX>
                      <table className={o.table}>
                        <thead><tr><th>Quarter</th><th>File</th><th className={o.num}>LPs</th><th className={o.num}>Count</th></tr></thead>
                        <tbody>
                          {byFile.map((f) => (
                            <tr key={`${f.quarter}-${f.type}`}>
                              <td className={o.mono}>{f.quarter || <span className={o.muted}>Unknown</span>}</td>
                              <td>{FILES[f.type]}</td>
                              <td className={o.num}>{f.lps.size}</td>
                              <td className={o.num}>{f.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollX>
                  ) : <p className={o.empty}>No downloads {rangeLabel}.</p>}
                </section>

                <section className={o.panel}>
                  <div className={o.panelHead}><h2 className={o.h2}>Company pages opened</h2><span className={o.count}>{companiesOpened.length}</span></div>
                  {companiesOpened.length ? (
                    <ScrollX>
                      <table className={o.table}>
                        <thead><tr><th>Company</th><th className={o.num}>LPs</th><th className={o.num}>Visits</th></tr></thead>
                        <tbody>
                          {companiesOpened.map((c) => (
                            <tr key={c.slug} title={[...c.lps].map(who).join(', ')}>
                              <td>{companyName(c.slug)}</td>
                              <td className={o.num}>{c.lps.size}</td>
                              <td className={o.num}>{c.visits}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollX>
                  ) : <p className={o.empty}>None {rangeLabel}.</p>}
                </section>

                <section className={o.panel}>
                  <div className={o.panelHead}><h2 className={o.h2}>Ratings</h2><span className={o.count}>{cur.ratings.length ? `avg ${cur.avgRating.toFixed(1)}` : 'none'}</span></div>
                  {comments.length ? comments.map((f, i) => (
                    <div key={`${f.email}-${f.at}-${i}`} className={o.comment}>
                      <span className={o.lpName}>{who(f.email)}</span> <span className={o.mono}>{f.score} / 10</span> <span className={o.muted}>{ago(f.at, now)}</span>
                      <p className={o.commentText}>{f.comment}</p>
                    </div>
                  )) : <p className={o.empty}>{cur.ratings.length ? 'No comments.' : `No ratings ${rangeLabel}.`}</p>}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
