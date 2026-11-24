import { requireTeamUser } from '@/decks/auth';
import { VOTE, listVotes, getSendLog } from '@/lib/lp-vote';
import { SignOutButton } from '../_components/SignOutButton';
import { ThemeSwitch, THEME_SCRIPT } from '../portal-usage/ThemeSwitch';
import o from '../portal-usage/dashboard.module.css';

export const metadata = { title: 'Fund II vote | Yali Team', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// Results of the Fund II term vote (src/lib/lp-vote.js): a pie of the votes, a company
// filter (by email domain, e.g. singularityamc.in), every vote with its date and time,
// and who was sent the email but has not voted. Pranav, Gani, Sunil and Ajay only.
const TZ = 'Asia/Kolkata';
const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
const time = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
const domainOf = (email) => String(email).split('@')[1] || '';
const COLORS = { '10-1-1': '#830d35', '12-1-1': '#5f7182' };

// Donut chart, one slice per option, with a hover title per slice.
function Pie({ counts, total }) {
  const R = 70, W = 26, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Votes by option">
      <circle cx="90" cy="90" r={R} fill="none" stroke="var(--rule)" strokeWidth={W} />
      {total > 0 && VOTE.options.map((opt) => {
        const n = counts[opt.id] || 0;
        if (!n) return null;
        const len = (n / total) * C;
        const el = (
          <circle key={opt.id} cx="90" cy="90" r={R} fill="none" stroke={COLORS[opt.id]} strokeWidth={W}
            strokeDasharray={`${Math.max(len - (n === total ? 0 : 2), 0)} ${C}`} strokeDashoffset={-offset} transform="rotate(-90 90 90)">
            <title>{`${opt.label}: ${n} vote${n === 1 ? '' : 's'}`}</title>
          </circle>
        );
        offset += len;
        return el;
      })}
      <text x="90" y="86" textAnchor="middle" style={{ font: '600 26px var(--font-inter), sans-serif', fill: 'var(--ink)' }}>{total}</text>
      <text x="90" y="106" textAnchor="middle" style={{ font: '12px var(--font-inter), sans-serif', fill: 'var(--soft)' }}>{total === 1 ? 'vote' : 'votes'}</text>
    </svg>
  );
}

export default async function FundVote({ searchParams }) {
  const email = await requireTeamUser('vote');
  const sp = await searchParams;
  let votes = [];
  let sent = [];
  let failed = false;
  try {
    const [v, log] = await Promise.all([listVotes(), getSendLog()]);
    votes = v.sort((a, b) => String(b.votedAt).localeCompare(String(a.votedAt)));
    sent = log?.sent || [];
  } catch {
    failed = true;
  }

  // Company filter, by email domain, over everyone sent the email or who voted.
  const domains = new Map();
  for (const e of new Set([...sent.map((x) => x.email), ...votes.map((v) => v.email)])) {
    const d = domainOf(e);
    domains.set(d, (domains.get(d) || 0) + 1);
  }
  const company = typeof sp?.company === 'string' && domains.has(sp.company) ? sp.company : '';
  const inCompany = (e) => !company || domainOf(e) === company;
  const shownVotes = votes.filter((v) => inCompany(v.email));
  const voted = new Set(votes.map((v) => v.email));
  const notVoted = sent.filter((x) => inCompany(x.email) && !voted.has(x.email));
  const sentCount = sent.filter((x) => inCompany(x.email)).length;
  const counts = Object.fromEntries(VOTE.options.map((opt) => [opt.id, shownVotes.filter((v) => v.choice === opt.id).length]));
  const total = shownVotes.length;
  const pct = (n) => (total ? `${Math.round((n / total) * 100)}%` : '–');
  const label = (id) => VOTE.options.find((opt) => opt.id === id)?.label || id;

  return (
    <div className={o.page} data-ops-page="" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <div className={o.bar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/team/" className={o.home}><img src="/favicon.svg" alt="Yali" /><span>Team</span></a>
        <span className={o.crumb}>/</span>
        <span>Fund II vote</span>
        <span className={o.barRight}>{email}</span>
        <ThemeSwitch />
        <SignOutButton />
      </div>
      <div className={o.body}>
        <div className={o.top}>
          <h1 className={o.title}>Fund II vote</h1>
          <span className={o.meta}>{VOTE.question} One vote per LP email, final. Times in IST.</span>
          <form method="get" style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label htmlFor="company" className={o.meta}>Company</label>
            <select id="company" name="company" defaultValue={company} style={{ font: 'inherit', fontSize: 12.5, padding: '5px 8px', border: '1px solid var(--rule-strong)', background: 'var(--surface)', color: 'var(--ink)' }}>
              <option value="">All companies</option>
              {[...domains].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([d, n]) => <option key={d} value={d}>@{d} ({n})</option>)}
            </select>
            <button type="submit" style={{ font: 'inherit', fontSize: 12.5, padding: '5px 12px', border: 'none', background: 'var(--ink)', color: 'var(--surface)', cursor: 'pointer' }}>Show</button>
          </form>
        </div>

        {failed ? <div className={o.panel}><p className={o.empty}>Could not load the vote right now.</p></div> : (
          <>
            <div className={o.stats}>
              <div className={o.stat}><span className={o.statLabel}>Votes</span><span className={o.statValue}>{total}</span></div>
              {VOTE.options.map((opt) => (
                <div key={opt.id} className={o.stat}><span className={o.statLabel}>{opt.label}</span><span className={o.statValue}>{counts[opt.id]}<span className={o.statSub}>{pct(counts[opt.id])}</span></span></div>
              ))}
              <div className={o.stat}><span className={o.statLabel}>Emails sent</span><span className={o.statValue}>{sentCount}</span></div>
              <div className={o.stat}><span className={o.statLabel}>Not voted yet</span><span className={o.statValue}>{notVoted.length}</span></div>
              <div className={o.stat}><span className={o.statLabel}>Response rate</span><span className={o.statValue}>{sentCount ? `${Math.round((shownVotes.length / sentCount) * 100)}%` : '–'}</span></div>
            </div>

            <div className={o.grid}>
              <div className={o.col}>
                <section className={o.panel}>
                  <div className={o.panelHead}><h2 className={o.h2}>Votes{company ? ` from @${company}` : ''}</h2><span className={o.count}>{total}</span></div>
                  {total ? (
                    <div className={o.scrollWrap}><div className={o.scroll}>
                      <table className={o.table}>
                        <thead><tr><th>Date</th><th>Time</th><th>Name</th><th>Email</th><th>Company</th><th>Vote</th></tr></thead>
                        <tbody>
                          {shownVotes.map((v) => (
                            <tr key={v._id}>
                              <td>{day(v.votedAt)}</td>
                              <td>{time(v.votedAt)}</td>
                              <td className={o.lpName}>{v.name || <span className={o.muted}>-</span>}</td>
                              <td>{v.email}</td>
                              <td>@{domainOf(v.email)}</td>
                              <td><span style={{ display: 'inline-block', width: 8, height: 8, background: COLORS[v.choice], marginRight: 8 }} />{label(v.choice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div></div>
                  ) : <p className={o.empty}>No votes yet.</p>}
                </section>

                <details className={`${o.panel} ${o.collapse}`}>
                  <summary className={o.panelHead}>
                    <h2 className={o.h2}>Sent, not voted yet</h2>
                    <span className={o.count}>{notVoted.length} <span className={o.toggle} data-show="Show" data-hide="Hide" /></span>
                  </summary>
                  {notVoted.length ? (
                    <div className={o.scrollWrap}><div className={o.scroll}>
                      <table className={o.table}>
                        <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Email sent</th></tr></thead>
                        <tbody>
                          {notVoted.map((x) => (
                            <tr key={x.email}>
                              <td className={o.lpName}>{x.name || <span className={o.muted}>-</span>}</td>
                              <td>{x.email}</td>
                              <td>@{domainOf(x.email)}</td>
                              <td>{x.sentAt ? `${day(x.sentAt)}, ${time(x.sentAt)}` : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div></div>
                  ) : <p className={o.empty}>{sent.length ? 'Everyone sent the email has voted.' : 'The email has not gone out yet.'}</p>}
                </details>
              </div>

              <div className={o.col}>
                <section className={o.panel}>
                  <div className={o.panelHead}><h2 className={o.h2}>Split{company ? ` at @${company}` : ''}</h2><span className={o.count}>{total} vote{total === 1 ? '' : 's'}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 14px', flexWrap: 'wrap' }}>
                    <Pie counts={counts} total={total} />
                    <div style={{ display: 'grid', gap: 10 }}>
                      {VOTE.options.map((opt) => (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 12, height: 12, background: COLORS[opt.id], display: 'inline-block' }} />
                          <span style={{ fontWeight: 600 }}>{opt.label}</span>
                          <span className={o.muted}>{counts[opt.id]} ({pct(counts[opt.id])})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
