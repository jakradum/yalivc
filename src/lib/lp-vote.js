// The Fund II term vote: one question, two options, one vote per LP email.
//
// Each LP gets their own email (sent by scripts/lp-vote-send.mjs) whose buttons carry
// a signed token for their address. Opening the link only SHOWS a confirm page
// (yali.vc/fund-vote); the vote is recorded only when the LP taps Confirm, which posts to
// /api/vote. Mail scanners that pre-open every link therefore never vote.
//
// Votes are `lpVote` documents in Supabase sanity_docs with an id derived from the
// email, written insert-only: a second vote for the same email hits the primary key
// and is refused, so nobody can vote twice or change their vote. Server-side only.
import crypto from 'crypto';
import { supa, SupabaseError } from './lp-data/rest.js';
import { getDoc, listDocs } from './private-docs.js';

export const VOTE = {
  id: 'fund2-term',
  question: 'Which fund term do you prefer for Yali Deeptech Fund II?',
  options: [
    { id: '10-1-1', label: '10 + 1 + 1', note: '10-year term, with two optional one-year extensions' },
    { id: '12-1-1', label: '12 + 1 + 1', note: '12-year term, with two optional one-year extensions' },
  ],
  // Votes are refused after this moment (end of 5 Dec 2026, IST).
  closesAt: '2026-12-05T23:59:59+05:30',
};

export const optionById = (id) => VOTE.options.find((o) => o.id === id) || null;
export const isOpen = (now = Date.now()) => !VOTE.closesAt || now < new Date(VOTE.closesAt).getTime();

const secret = () => {
  const s = process.env.PORTAL_AUTH_SECRET;
  if (!s) throw new Error('PORTAL_AUTH_SECRET is required');
  return s;
};
const sign = (email) => crypto.createHmac('sha256', secret()).update(`vote:${VOTE.id}:${email}`).digest('hex').slice(0, 32);
const b64 = (s) => Buffer.from(s).toString('base64url');

// The link token for one address: "<base64url email>.<signature>".
export function voteToken(email) {
  const e = String(email).toLowerCase().trim();
  return `${b64(e)}.${sign(e)}`;
}

// The email a token was issued to, or null if it was not issued by us.
export function emailFromToken(token) {
  if (typeof token !== 'string' || token.length > 400) return null;
  const [part, sig] = token.split('.');
  if (!part || !sig) return null;
  let email;
  try {
    email = Buffer.from(part, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const want = Buffer.from(sign(email));
  const got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got) ? email : null;
}

const voteId = (email) => `lpVote.${VOTE.id}.${crypto.createHash('sha256').update(String(email).toLowerCase()).digest('hex').slice(0, 24)}`;

export const getVote = (email) => getDoc(voteId(email));

// Records a vote once. Returns { vote } on success, or { already: existingVote }.
export async function castVote(email, choice, extra = {}) {
  const id = voteId(email);
  const now = new Date().toISOString();
  const rev = crypto.randomBytes(11).toString('hex');
  const doc = { _id: id, _type: 'lpVote', voteId: VOTE.id, email: String(email).toLowerCase(), choice, votedAt: now, ...extra, _createdAt: now, _updatedAt: now, _rev: rev };
  try {
    // Plain insert, no upsert: an existing row with this id makes it fail.
    await supa('/rest/v1/sanity_docs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { id, type: 'lpVote', rev, sanity_updated_at: now, doc, synced_at: now } });
    return { vote: doc };
  } catch (err) {
    if (err instanceof SupabaseError && err.status === 409) return { already: await getVote(email) };
    throw err;
  }
}

export const listVotes = async () => (await listDocs('lpVote')).filter((v) => v.voteId === VOTE.id);

// Who the email went to: the `lpVoteSend` document kept by scripts/lp-vote-send.mjs.
export const getSendLog = () => getDoc(`lpVoteSend.${VOTE.id}`);
