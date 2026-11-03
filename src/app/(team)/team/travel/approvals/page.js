import { requireTeamUser } from '@/decks/auth';
import { fmtDate } from '@/lib/leaveEmail/templates';
import { TRAVEL_APPROVER } from '@/lib/travel/profiles';
import { listTravelRequests } from '@/lib/travel/store';
import { SignOutButton } from '../../builder/SignOutButton';
import { DecideButtons } from './DecideButtons';
import s from '../travel.module.css';

export const metadata = { title: 'Travel approvals — Yali Team', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const LABEL = { pending: 'Awaiting Gani', approved: 'Approved', rejected: 'Rejected' };
const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

// Behind the Yali Microsoft sign-in (ACCESS.travel). Gani approves here; the others
// on the list can see where a request stands but get no buttons (the decide API
// enforces that too).
export default async function TravelApprovals() {
  const email = await requireTeamUser('travel');
  const canDecide = email === TRAVEL_APPROVER.email;
  const all = await listTravelRequests();
  const pending = all.filter((r) => r.status === 'pending');
  const decided = all.filter((r) => r.status !== 'pending').slice(0, 30);

  const Item = ({ r }) => (
    <div className={s.req}>
      <div className={s.reqHead}>
        <span className={s.reqRoute}>{r.from} → {r.to}</span>
        <span className={`${s.pill} ${s[r.status]}`}>{LABEL[r.status] || r.status}</span>
      </div>
      <div className={s.meta}>
        {fmtDate(r.depDate)}{r.retDate ? `, back ${fmtDate(r.retDate)}` : ', one way'} · {r.travellers.join(', ')}<br />
        {r.purpose && <>{r.purpose}<br /></>}
        {[r.prefTiming && `Timing: ${r.prefTiming}`, r.prefFlight && `Flight: ${r.prefFlight}`, r.cab && 'Cab', r.hotel && 'Hotel'].filter(Boolean).join(' · ')}
        {r.notes && <><br />Notes: {r.notes}</>}
        {r.screenshotUrl && <><br /><a href={r.screenshotUrl} target="_blank" rel="noreferrer">Flight screenshot</a></>}
        <br />Requested by {r.requester}, {when(r._createdAt)}
        {r.decidedAt && <> · {LABEL[r.status]} {when(r.decidedAt)}</>}
      </div>
      {canDecide && r.status === 'pending' && <DecideButtons id={r._id} />}
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.bar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/team/"><img src="/favicon.svg" alt="Yali" /></a>
        <span className={s.divider} />
        <span className={s.barTitle}>Travel approvals</span>
        <span className={s.barRight}>{email}</span>
        <SignOutButton />
      </div>
      <main className={`${s.main} ${s.wide}`}>
        <div className={s.eyebrow}>Travel desk</div>
        <h1 className={s.h1}>Travel approvals</h1>
        <p className={s.lede}>
          {canDecide
            ? 'Approving emails Karthik Sunder the full booking details (cc the requester) to book with the travel desk. Rejecting emails the requester.'
            : 'Only Gani can approve. You can see where each request stands.'}
        </p>

        <div className={s.card}>
          <div className={s.cardTitle}>Pending ({pending.length})</div>
          {pending.length ? pending.map((r) => <Item key={r._id} r={r} />) : <p className={s.empty}>Nothing waiting.</p>}
        </div>

        <div className={s.card}>
          <div className={s.cardTitle}>Recent decisions</div>
          {decided.length ? decided.map((r) => <Item key={r._id} r={r} />) : <p className={s.empty}>None yet.</p>}
        </div>
      </main>
    </div>
  );
}
