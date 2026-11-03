import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isBuilderHost } from '@/decks/auth';
import { TEAM_COOKIE, verifyTeamSession } from '@/lib/teamSession';
import { EMAILS, allowedNamesFor, canonicalName } from '@/lib/leaveEmail/directory';
import { TRAVELLERS, publicTravellerList } from '@/lib/travel/profiles';
import { createTravelRequest, uploadScreenshot } from '@/lib/travel/store';
import { approvalNeededEmail, receivedEmail } from '@/lib/travel/emails';
import { sendAll } from '@/lib/travel/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The travel request form (team.yali.vc/travel), behind the team sign-in. The
// requester is the signed-in person (or anyone, for LOGS_FOR_OTHERS); travellers
// can be any colleague on file. Fields are bounded and email recipients come from
// the directory. Approval happens at /travel/approvals.
const notFound = () => new NextResponse('Not found', { status: 404 });
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;

const hits = new Map();
function allowed(ip) {
  const now = Date.now();
  const r = hits.get(ip);
  if (!r || now - r.start > 60 * 60 * 1000) { hits.set(ip, { start: now, n: 1 }); return true; }
  r.n += 1;
  return r.n <= 20;
}

const sessionEmail = async () => verifyTeamSession((await cookies()).get(TEAM_COOKIE)?.value);

export async function GET(request) {
  if (!isBuilderHost(request.headers.get('host') || '')) return notFound();
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  const requesters = allowedNamesFor(email).filter((n) => EMAILS[n]).sort();
  return NextResponse.json({ travellers: publicTravellerList(), requesters });
}

export async function POST(request) {
  if (!isBuilderHost(request.headers.get('host') || '')) return notFound();
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  if (!process.env.SANITY_WRITE_TOKEN) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  if (!allowed(ip)) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });

  const b = await request.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'Bad request.' }, { status: 400 });

  const requester = canonicalName(b.requester);
  if (!requester || !EMAILS[requester]) return NextResponse.json({ error: 'Pick your name.' }, { status: 400 });
  if (!allowedNamesFor(email).includes(requester)) return NextResponse.json({ error: 'You can only request travel as yourself.' }, { status: 403 });
  const travellers = [...new Set((Array.isArray(b.travellers) ? b.travellers : []).map(canonicalName))];
  if (!travellers.length || travellers.some((t) => !t || !TRAVELLERS[t])) {
    return NextResponse.json({ error: 'Pick at least one traveller.' }, { status: 400 });
  }
  const from = str(b.from, 80), to = str(b.to, 80);
  if (!from || !to) return NextResponse.json({ error: 'Fill in From and To.' }, { status: 400 });
  if (!ISO.test(b.depDate)) return NextResponse.json({ error: 'Pick a departure date.' }, { status: 400 });
  const retDate = b.retDate ? (ISO.test(b.retDate) && b.retDate >= b.depDate ? b.retDate : null) : null;
  if (b.retDate && !retDate) return NextResponse.json({ error: 'Return date must be on or after departure.' }, { status: 400 });

  let screenshotUrl = null;
  const m = typeof b.screenshot === 'string' && b.screenshot.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (m) {
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Screenshot is too large.' }, { status: 400 });
    try { screenshotUrl = await uploadScreenshot(buf, m[1]); } catch (e) { console.error('[travel] screenshot upload failed:', e.message); }
  }

  const data = {
    requester, travellers, from, to, depDate: b.depDate, retDate,
    purpose: str(b.purpose, 200), prefTiming: str(b.prefTiming, 120), prefFlight: str(b.prefFlight, 120),
    cab: b.cab === true, hotel: b.hotel === true, notes: str(b.notes, 1000), screenshotUrl,
  };

  let doc;
  try { doc = await createTravelRequest(data); } catch (e) {
    console.error('[travel] create failed:', e.message);
    return NextResponse.json({ error: "Couldn't save the request. Try again." }, { status: 500 });
  }
  await sendAll([approvalNeededEmail(data), receivedEmail(data)]);
  return NextResponse.json({ ok: true, id: doc._id });
}
