import { NextResponse } from 'next/server';
import { emailFromToken, castVote, optionById, isOpen } from '@/lib/lp-vote';
import { getPortalUserByEmail } from '@/lib/lp-data';

// Records a Fund II term vote. Only the Confirm tap on yali.vc/fund-vote calls this
// (same-origin fetch with a custom header, which a form post, a link pre-fetch or
// another site cannot send without a CORS preflight we never answer). One vote per
// email, final: a second attempt gets the recorded vote back, unchanged.
const NO_STORE = { 'Cache-Control': 'no-store' };
const ALLOWED = new Set(['https://yali.vc', 'https://www.yali.vc']);

export async function POST(request) {
  const origin = request.headers.get('origin');
  const local = process.env.NODE_ENV !== 'production';
  if (request.headers.get('x-yali-vote') !== '1' || (!local && !ALLOWED.has(origin))) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403, headers: NO_STORE });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: NO_STORE });
  }
  const email = emailFromToken(body?.token);
  if (!email) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400, headers: NO_STORE });
  const option = optionById(body?.choice);
  if (!option) return NextResponse.json({ error: 'Please select an option.' }, { status: 400, headers: NO_STORE });
  if (!isOpen()) return NextResponse.json({ error: 'Voting has closed.' }, { status: 410, headers: NO_STORE });

  try {
    const user = await getPortalUserByEmail(email).catch(() => null);
    const res = await castVote(email, option.id, { name: user?.name || null });
    if (res.already) return NextResponse.json({ status: 'already', choice: res.already.choice, votedAt: res.already.votedAt }, { headers: NO_STORE });
    return NextResponse.json({ status: 'recorded', choice: res.vote.choice, votedAt: res.vote.votedAt }, { headers: NO_STORE });
  } catch (err) {
    console.error('[vote] failed:', err.message);
    return NextResponse.json({ error: 'Could not record your vote right now. Please try again in a minute.' }, { status: 500, headers: NO_STORE });
  }
}
