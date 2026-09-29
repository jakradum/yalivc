// Reads Pranav's calendar via a DELEGATED Microsoft Graph grant (Calendars.Read
// + offline_access) that he consented to himself at
// /api/pitch-scheduler-calendar-connect - not an app-only Application
// permission, since that needs Global Admin consent which wasn't available.
// The resulting refresh token lives in the pitchSchedulerCalendarAuth Sanity
// singleton and gets rotated here on every use (Microsoft may issue a new one
// each refresh; failing to persist it breaks the chain).
//
// Used by computeCandidateSlots() (pitch-scheduler-invite-manual route). The
// actual pitch slots offered are NOT hardcoded times filtered against
// busy/free - Pranav maintains specifically-titled placeholder events on his
// calendar ("Pitch meeting placeholder" on Tue/Fri, "Weekly Pitch Meeting:
// Additional slots" on Mon/Wed) whose mere EXISTENCE at a given time IS the
// availability signal. Deleting an occurrence (holiday, travel, a real
// meeting got booked there instead) is how he marks a date as not offered -
// so we read those titled events directly and use their real start/end
// times, rather than computing a fixed pattern and checking for conflicts.

import { createClient } from '@sanity/client';

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const SCOPE = 'https://graph.microsoft.com/User.Read offline_access https://graph.microsoft.com/Calendars.Read';
const AUTH_DOC_ID = 'pitchSchedulerCalendarAuth';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // needed to both read the stored token and rotate it
});

// In-memory only - fine for a serverless function's short lifetime, avoids
// hitting Sanity + Microsoft on every single request within the same warm
// instance.
let tokenCache = { token: null, expiresAt: 0 };

async function refreshAccessToken() {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) return null;

  const authDoc = await sanityClient.fetch(`*[_id == $id][0]{refreshToken}`, { id: AUTH_DOC_ID }).catch((err) => {
    console.error('Failed to read stored calendar refresh token:', err);
    return null;
  });
  if (!authDoc?.refreshToken) return null; // not connected yet - see the connect route

  let res;
  try {
    res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: authDoc.refreshToken,
        scope: SCOPE,
      }),
    });
  } catch (err) {
    console.error('Calendar refresh token request errored:', err);
    return null;
  }
  if (!res.ok) {
    console.error('Calendar refresh token request failed:', res.status, await res.text().catch(() => ''));
    return null;
  }

  const data = await res.json();
  if (data.refresh_token && data.refresh_token !== authDoc.refreshToken) {
    // Rotation happened - persist it or the next refresh will fail with the
    // old (now invalid) token. Best-effort: don't block returning the access
    // token we already have just because this write hiccups.
    await sanityClient
      .patch(AUTH_DOC_ID)
      .set({ refreshToken: data.refresh_token, updatedAt: new Date().toISOString() })
      .commit()
      .catch((err) => console.error('Failed to persist rotated calendar refresh token:', err));
  }

  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

async function getGraphToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;
  return refreshAccessToken();
}

// Returns [{startUTC, endUTC}, ...] (ISO strings) for every calendar event in
// the window whose subject matches one of titleMatchers (case-insensitive
// substring match, e.g. "pitch meeting placeholder"), sorted chronologically
// - or null if calendar access isn't connected/reachable. A deleted
// occurrence of a recurring placeholder simply doesn't appear in Graph's
// results, which is exactly the "not offered" signal we want - no separate
// busy/free logic needed.
export async function getPlaceholderSlots(startISO, endISO, titleMatchers) {
  const token = await getGraphToken();
  if (!token) return null;

  const params = new URLSearchParams({
    startDateTime: startISO,
    endDateTime: endISO,
    $select: 'subject,start,end',
    $top: '250',
    $orderby: 'start/dateTime',
  });
  // /me resolves to whichever account completed the consent flow (Pranav) -
  // no mailbox address needed, unlike the app-only approach this replaced.
  const url = `https://graph.microsoft.com/v1.0/me/calendarView?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' },
    });
    if (!res.ok) {
      console.error('Graph calendarView request failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const lowerMatchers = titleMatchers.map((m) => m.toLowerCase());
    return (data.value || [])
      .filter((event) => {
        const subject = (event.subject || '').toLowerCase();
        return lowerMatchers.some((m) => subject.includes(m));
      })
      .map((event) => ({
        startUTC: event.start.dateTime.endsWith('Z') ? event.start.dateTime : `${event.start.dateTime}Z`,
        endUTC: event.end.dateTime.endsWith('Z') ? event.end.dateTime : `${event.end.dateTime}Z`,
      }));
  } catch (err) {
    console.error('Graph calendarView request errored:', err);
    return null;
  }
}
