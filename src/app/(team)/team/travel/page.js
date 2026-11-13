import { TravelForm } from './TravelForm';
import s from './travel.module.css';
import { Breadcrumbs, TEAM } from '../_components/Breadcrumbs';

export const metadata = { title: 'Travel request — Yali Team', robots: 'noindex, nofollow' };

// Any signed-in Yali account (the whole team site is behind sign-in). Approval is
// at /travel/approvals, for Gani only.
export default function TravelPage() {
  return (
    <div className={s.page}>
      <div className={s.bar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/team/"><img src="/favicon.svg" alt="Yali" /></a>
        <span className={s.divider} />
        <span className={s.barTitle}>Travel request</span>
      </div>
      <Breadcrumbs trail={[TEAM, ['Travel request']]} />
      <main className={s.main}>
        <h1 className={s.h1}>Flight booking request</h1>
        <p className={s.lede}>Pick the travellers and add the trip. Gani approves it, then Karthik Sunder books it with the travel desk.</p>
        <TravelForm />
      </main>
      <Breadcrumbs trail={[TEAM, ['Travel request']]} position="bottom" />
    </div>
  );
}
