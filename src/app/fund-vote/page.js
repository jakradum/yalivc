import { emailFromToken, getVote, optionById, VOTE, isOpen } from '@/lib/lp-vote';
import { VoteConfirm } from './VoteConfirm';
import s from './vote.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Fund II terms | Yali Capital', robots: { index: false, follow: false, nocache: true } };

// Landing page for the Fund II term vote email. Opening it records nothing: the LP
// confirms with a tap (VoteConfirm), so mail scanners that pre-open links never vote.
// One vote per email, final (src/lib/lp-vote.js).
const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });

function Frame({ children }) {
  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <div className={s.hero}>
          <h1 className={s.title}>Fund II terms: <span>one quick vote</span></h1>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}

export default async function FundVotePage({ searchParams }) {
  const sp = await searchParams;
  const token = typeof sp?.t === 'string' ? sp.t : '';
  const email = emailFromToken(token);

  if (!email) {
    return <Frame><p className={s.text}>This link is not valid. Please use the buttons in the email you received, or write to <a href="mailto:investor-relations@yali.vc">investor-relations@yali.vc</a>.</p></Frame>;
  }

  const existing = await getVote(email).catch(() => null);
  if (existing) {
    return (
      <Frame>
        <p className={s.text}>Thank you. Your vote is recorded:</p>
        <p className={s.result}>{optionById(existing.choice)?.label || existing.choice}</p>
        <p className={s.small}>Voted on {when(existing.votedAt)} IST. Votes are final.</p>
      </Frame>
    );
  }

  if (!isOpen()) {
    return <Frame><p className={s.text}>Voting has closed. Thank you for your interest.</p></Frame>;
  }

  const initial = optionById(sp?.choice)?.id || null;
  return (
    <Frame>
      <p className={s.text}>{VOTE.question} Check your choice and tap Confirm. You can vote once, and your vote is final.</p>
      <VoteConfirm token={token} options={VOTE.options} initial={initial} />
    </Frame>
  );
}
