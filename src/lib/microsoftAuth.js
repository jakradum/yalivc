import crypto from 'crypto';

// Verifies a Microsoft sign-in ON THE SERVER. The browser signs in through the
// existing Firebase "microsoft.com" provider (the same one the leave dashboard
// uses) and hands us Microsoft's own tokens; we never trust an email address the
// client claims, and we don't rely on a Firebase token's `email`, which for a
// multi-tenant provider can be an unverified attribute from someone else's
// tenant (the "nOAuth" problem).
//
//   1. Preferred: Microsoft's ID token — RS256 signature checked against the
//      tenant's published keys, issuer/tenant pinned to Yali's, expiry checked.
//   2. Fallback: the access token, proven by calling Microsoft Graph /me — its
//      userPrincipalName is on a domain only the owning tenant can verify, so
//      another tenant can't claim an @yali.vc address.
// Either way the address must end @yali.vc.
export const TENANT_ID = process.env.TEAM_MS_TENANT_ID || 'b06b57f2-f87d-413e-88f1-e0d4ad82c2fd';
const ISSUER = `https://login.microsoftonline.com/${TENANT_ID}/v2.0`;
const JWKS_URL = `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`;
const GRAPH_ME = 'https://graph.microsoft.com/v1.0/me?$select=userPrincipalName,mail,displayName';
const DOMAIN = '@yali.vc';

const b64json = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
let jwksCache = { at: 0, keys: null };

async function getKeys(fetchImpl, force = false) {
  if (!force && jwksCache.keys && Date.now() - jwksCache.at < 60 * 60 * 1000) return jwksCache.keys;
  const res = await fetchImpl(JWKS_URL);
  if (!res.ok) throw new Error('Could not load Microsoft signing keys');
  jwksCache = { at: Date.now(), keys: (await res.json()).keys || [] };
  return jwksCache.keys;
}
export const _resetKeyCache = () => {
  jwksCache = { at: 0, keys: null };
};

export async function verifyIdToken(idToken, { fetchImpl = fetch, now = Date.now(), clientId = process.env.TEAM_MS_CLIENT_ID } = {}) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const header = b64json(parts[0]);
  const claims = b64json(parts[1]);
  if (header.alg !== 'RS256') throw new Error('Unexpected token algorithm');

  let keys = await getKeys(fetchImpl);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    keys = await getKeys(fetchImpl, true); // keys rotate; refetch once
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error('Unknown signing key');
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), crypto.createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'));
  if (!ok) throw new Error('Bad token signature');

  const sec = Math.floor(now / 1000);
  if (claims.tid !== TENANT_ID || claims.iss !== ISSUER) throw new Error('Not a Yali tenant token');
  if (typeof claims.exp !== 'number' || claims.exp < sec - 60) throw new Error('Token expired');
  if (typeof claims.nbf === 'number' && claims.nbf > sec + 60) throw new Error('Token not yet valid');
  if (clientId && claims.aud !== clientId) throw new Error('Token was issued for a different app');
  const email = String(claims.email || claims.preferred_username || '').toLowerCase();
  if (!email.endsWith(DOMAIN)) throw new Error('Not a Yali account');
  return email;
}

export async function verifyViaGraph(accessToken, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(GRAPH_ME, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error('Microsoft did not accept the token');
  const me = await res.json();
  const upn = String(me.userPrincipalName || '').toLowerCase();
  if (!upn.endsWith(DOMAIN)) throw new Error('Not a Yali account');
  return upn;
}

// → { email, via } or throws. Tries the ID token, then falls back to Graph.
export async function verifyMicrosoftLogin({ idToken, accessToken }, deps = {}) {
  const failures = [];
  if (idToken) {
    try {
      return { email: await verifyIdToken(idToken, deps), via: 'id-token' };
    } catch (e) {
      failures.push(`id-token: ${e.message}`);
    }
  }
  if (accessToken) {
    try {
      return { email: await verifyViaGraph(accessToken, deps), via: 'graph' };
    } catch (e) {
      failures.push(`graph: ${e.message}`);
    }
  }
  const err = new Error(failures.length ? failures.join(' | ') : 'No Microsoft token received');
  err.failures = failures;
  throw err;
}
