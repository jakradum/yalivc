import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const REDIRECT_URI = 'https://yali.vc/api/pitch-scheduler-calendar-callback';
const STATE_COOKIE = 'pitch-scheduler-calendar-state';
const SCOPE = 'openid offline_access https://graph.microsoft.com/Calendars.Read';
const AUTH_DOC_ID = 'pitchSchedulerCalendarAuth';

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

function htmlPage(title, body) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:48px;color:#363636;"><h2>${title}</h2><p>${body}</p></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;

  if (errorParam) {
    // Most notably: AADSTS65004/consent_required-style errors land here if
    // the tenant restricts user consent for this scope - that means the
    // delegated workaround doesn't apply and an admin is needed after all.
    return htmlPage('Connection failed', `Microsoft returned an error: ${errorParam} — ${url.searchParams.get('error_description') || ''}`);
  }
  if (!code || !state || state !== cookieState) {
    return htmlPage('Invalid request', 'This link has expired or was already used. Start again from /api/pitch-scheduler-calendar-connect.');
  }

  let tokenData;
  try {
    const tokenRes = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        scope: SCOPE,
      }),
    });
    tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.refresh_token) {
      console.error('Calendar connect token exchange failed:', tokenRes.status, tokenData);
      return htmlPage('Connection failed', 'Microsoft accepted the sign-in but did not return a refresh token. Check server logs.');
    }
  } catch (err) {
    console.error('Calendar connect token exchange errored:', err);
    return htmlPage('Connection failed', 'Could not reach Microsoft to complete the connection.');
  }

  // Decode the id_token for a human-readable "connected as" label only -
  // nothing here trusts this for access control, it's just for the Studio
  // preview so Pranav can confirm the right account connected.
  let connectedBy = 'unknown';
  try {
    const claims = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64url').toString('utf8'));
    connectedBy = claims.preferred_username || claims.email || 'unknown';
  } catch {
    // non-fatal, just cosmetic
  }

  try {
    await writeClient.createOrReplace({
      _id: AUTH_DOC_ID,
      _type: 'pitchSchedulerCalendarAuth',
      refreshToken: tokenData.refresh_token,
      connectedBy,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to save calendar connection:', err);
    return htmlPage('Connection failed', 'Got the token from Microsoft but failed to save it. Check server logs.');
  }

  const response = htmlPage('Calendar connected', `Connected as <strong>${connectedBy}</strong>. You can close this tab — the pitch scheduler will now check this calendar before offering slots.`);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
