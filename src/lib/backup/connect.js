// Consent flow for the OneDrive backup. Pranav (signed in on team.yali.vc)
// opens /api/backup-connect, which sends him to Microsoft with a signed
// `state`. Microsoft redirects back to the redirect URI already registered on
// the Azure app (the pitch scheduler calendar callback); that route hands any
// request whose state starts with "bk1." to handleBackupCallback() below, so
// the calendar flow itself is unchanged.
//
// The state can't be tied to a cookie (it's issued on team.yali.vc and comes
// back on yali.vc), so it is HMAC-signed, expires after 10 minutes, and the
// callback only stores the token if the Microsoft account that consented is
// the same Yali address the state was issued to. Tokens are never logged.
import crypto from 'node:crypto';
import { BACKUP_OWNER, REDIRECT_URI, backupTarget, driveClient, graphConfig, supabaseTokenStore } from './graph.js';

export const STATE_PREFIX = 'bk1.';
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(`backup-connect:${data}`).digest('base64url');

export function signState(email, { secret = process.env.PORTAL_AUTH_SECRET, now = Date.now() } = {}) {
  if (!secret) throw new Error('PORTAL_AUTH_SECRET is not set');
  const payload = Buffer.from(JSON.stringify({ e: String(email).toLowerCase(), t: now, n: crypto.randomBytes(12).toString('hex') })).toString('base64url');
  return `${STATE_PREFIX}${payload}.${hmac(secret, payload)}`;
}

export const isBackupState = (state) => typeof state === 'string' && state.startsWith(STATE_PREFIX);

// → the email the state was issued to, or null.
export function verifyState(state, { secret = process.env.PORTAL_AUTH_SECRET, now = Date.now() } = {}) {
  if (!secret || !isBackupState(state)) return null;
  const [payload, sig] = state.slice(STATE_PREFIX.length).split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(hmac(secret, payload));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const age = now - data.t;
  if (typeof data.t !== 'number' || age < 0 || age > STATE_MAX_AGE_MS || typeof data.e !== 'string') return null;
  return data.e;
}

export function authorizeUrl(email, env = process.env) {
  const { tenant, clientId } = graphConfig(env);
  const target = backupTarget(env);
  // No `prompt` param: in this tenant forcing a consent screen fails even when
  // everything is consented (see pitch-scheduler-calendar-connect).
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: target.connectScope,
    state: signState(email, { secret: env.PORTAL_AUTH_SECRET }),
    login_hint: BACKUP_OWNER,
  });
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function page(title, body, status = 200) {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>${esc(title)}</title></head><body style="font-family:system-ui,sans-serif;padding:48px;color:#363636;max-width:640px"><h2>${esc(title)}</h2><p>${esc(body)}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
}

export async function handleBackupCallback(request, { env = process.env, fetchImpl = fetch } = {}) {
  const url = new URL(request.url);
  const email = verifyState(url.searchParams.get('state'), { secret: env.PORTAL_AUTH_SECRET });
  if (!email) return page('Invalid request', 'This link has expired or is not valid. Start again at https://team.yali.vc/api/backup-connect.', 400);

  const errorParam = url.searchParams.get('error');
  if (errorParam) {
    // e.g. consent_required / access_denied when the tenant needs an admin to approve the scope.
    return page('Connection failed', `Microsoft returned: ${errorParam}. ${url.searchParams.get('error_description') || ''}`.slice(0, 600), 400);
  }
  const code = url.searchParams.get('code');
  if (!code) return page('Invalid request', 'No authorization code was returned. Start again at https://team.yali.vc/api/backup-connect.', 400);

  let config, target;
  try {
    config = graphConfig(env);
    target = backupTarget(env);
  } catch (err) {
    return page('Not configured', err.message, 500);
  }

  let tokenData;
  try {
    const res = await fetchImpl(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        scope: target.connectScope,
      }),
    });
    tokenData = await res.json().catch(() => ({}));
    if (!res.ok || !tokenData.refresh_token || !tokenData.access_token) {
      console.error('[backup-connect] token exchange failed:', res.status, tokenData.error || 'no refresh token');
      return page('Connection failed', `Microsoft did not return a refresh token (${res.status} ${tokenData.error || ''}).`, 502);
    }
  } catch {
    return page('Connection failed', 'Could not reach Microsoft to complete the connection.', 502);
  }

  // The backups land in the consenting account's OneDrive, so it must be the owner's.
  const drive = driveClient({ token: tokenData.access_token, target, fetchImpl });
  let upn;
  try {
    upn = await drive.me();
  } catch (err) {
    return page('Connection failed', `Could not check which account signed in (${err.message}).`, 502);
  }
  if (upn !== email || upn !== BACKUP_OWNER) {
    return page('Wrong account', `You consented as ${upn || 'an unknown account'}, but the backups must go to ${BACKUP_OWNER}'s OneDrive. Nothing was saved.`, 403);
  }

  try {
    await supabaseTokenStore({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY, fetchImpl }).save(tokenData.refresh_token, tokenData.scope || target.scope);
  } catch (err) {
    console.error('[backup-connect] could not store the token:', err.message);
    return page('Connection failed', 'Got the token from Microsoft but could not save it (is migration 0003 applied?).', 500);
  }

  // Create the backup folder now so a scope problem shows up here, not at 3 a.m.
  let where = target.label;
  try {
    const info = await drive.rootInfo();
    if (info?.webUrl) where = decodeURIComponent(new URL(info.webUrl).pathname.split('/Documents/')[1] || info.name || where);
  } catch (err) {
    return page('Connected, but the folder check failed', `The token is saved, but creating the backup folder failed: ${err.message}. The next backup run will report the same error.`, 502);
  }
  return page('OneDrive backup connected', `Connected as ${upn}. Backups will be written to ${where} in your OneDrive, twice a week.`);
}
