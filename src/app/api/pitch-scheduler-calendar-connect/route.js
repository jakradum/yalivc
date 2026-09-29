import { NextResponse } from 'next/server';
import crypto from 'crypto';

// One-time (or occasional, if the connection ever needs redoing) interactive
// flow: Pranav visits this URL, signs in to Microsoft, and consents to a
// DELEGATED Calendars.Read grant on his own mailbox. This exists because the
// tenant's Application-permission Calendars.Read grant needs a Global Admin
// who wasn't available - a delegated grant only needs the resource owner
// (Pranav) to consent, though it may still bounce to "needs admin approval"
// if the tenant restricts user consent entirely. See
// docs/pitch-scheduler-plan.md for the full picture.
//
// No auth gate on this route itself beyond Microsoft's own login+consent
// screen - acceptable for a one-time manual setup step, since whoever
// completes the Microsoft sign-in is the account that gets connected, and
// only Pranav's own credentials grant access to his own calendar.

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const REDIRECT_URI = 'https://yali.vc/api/pitch-scheduler-calendar-callback';
const STATE_COOKIE = 'pitch-scheduler-calendar-state';
const SCOPE = 'https://graph.microsoft.com/User.Read offline_access https://graph.microsoft.com/Calendars.Read';

export async function GET() {
  if (!TENANT_ID || !CLIENT_ID) {
    return NextResponse.json({ error: 'MS_GRAPH_TENANT_ID / MS_GRAPH_CLIENT_ID not configured' }, { status: 500 });
  }

  // No `prompt` param on purpose: forcing a consent screen (prompt=consent)
  // triggered "needs admin approval" in this tenant even once every scope
  // was fully admin-consented - a tenant that blocks user-facing consent
  // screens outright seems to treat "render a consent UI at all" as the
  // thing it blocks, regardless of whether anything new would actually be
  // granted. Omitting prompt lets Microsoft skip the screen entirely when
  // nothing new needs approving, which is the normal case here.
  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPE,
    state,
  });

  const response = NextResponse.redirect(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`);
  response.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
  return response;
}
