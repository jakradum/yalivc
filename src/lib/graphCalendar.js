// App-only (client-credentials) Microsoft Graph access to read Pranav's
// calendar from server code that has no user session - unlike
// microsoftAuth.js, which verifies a person signing in, this authenticates
// as an application and should be scoped (via an Exchange Online
// Application Access Policy) to read only pranav@yali.vc's calendar, not
// the whole tenant. See docs/pitch-scheduler-plan.md for setup steps.
//
// Used by computeCandidateSlots() (pitch-scheduler-invite-manual route) to
// filter out slots that conflict with an actual calendar event - closing
// the gap where the manual/Studio invitation path had no calendar
// awareness at all (unlike the routine, which checks live via its own
// Outlook MCP connector).

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID || process.env.TEAM_MS_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const MAILBOX = process.env.PITCH_SCHEDULER_CALENDAR_MAILBOX || 'pranav@yali.vc';

let tokenCache = { token: null, expiresAt: 0 };

async function getGraphToken() {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) return null;
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;

  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) {
    console.error('Graph token request failed:', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

// Returns busy intervals as [{start: Date, end: Date}, ...] in the given
// window, or null if calendar access isn't configured/reachable - callers
// should treat null as "couldn't check" and decide their own fallback
// (this module fails closed on error, not open - see the route for the
// actual fallback policy).
export async function getBusyIntervals(startISO, endISO) {
  const token = await getGraphToken();
  if (!token) return null;

  const params = new URLSearchParams({
    startDateTime: startISO,
    endDateTime: endISO,
    $select: 'start,end,showAs',
    $top: '250',
  });
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MAILBOX)}/calendarView?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' },
    });
    if (!res.ok) {
      console.error('Graph calendarView request failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    return (data.value || [])
      .filter((event) => event.showAs !== 'free') // tentative/busy/oof all block a slot; "free" events don't
      .map((event) => ({ start: new Date(event.start.dateTime + 'Z'), end: new Date(event.end.dateTime + 'Z') }));
  } catch (err) {
    console.error('Graph calendarView request errored:', err);
    return null;
  }
}

export function overlapsAny(slotStart, slotEnd, busyIntervals) {
  return busyIntervals.some((b) => slotStart < b.end && slotEnd > b.start);
}
