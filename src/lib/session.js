import crypto from 'crypto';

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;

// Session cookies for the LP portal and the data room. Both are signed with
// PORTAL_AUTH_SECRET, so each signature is domain-separated by a scope prefix
// ("portal:" / "dataroom:"): a data room cookie can never pass as an LP portal
// cookie, or the other way round. Same idea as the team portal's "team:".
// Cookie format: email:timestamp:hex-signature, signed over `${scope}:${email}:${timestamp}`.
export const SESSION_SCOPES = {
  portal: 30 * 24 * 60 * 60 * 1000,         // 30 days
  dataroom: 6 * 30 * 24 * 60 * 60 * 1000,   // ~6 months
};

export function signSessionFor(scope, email, timestamp = Date.now().toString()) {
  if (!SESSION_SCOPES[scope]) throw new Error(`Unknown session scope: ${scope}`);
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(`${scope}:${email}:${timestamp}`).digest('hex');
  return `${email}:${timestamp}:${sig}`;
}

/**
 * Verifies a session cookie for one scope ('portal' or 'dataroom').
 * Returns the email if the signature is valid for that scope and the session
 * is within its age limit; otherwise null.
 */
export function verifySession(cookieValue, scope) {
  const maxAge = SESSION_SCOPES[scope];
  if (!cookieValue || !AUTH_SECRET || !maxAge) return null;
  const lastColon = cookieValue.lastIndexOf(':');
  if (lastColon === -1) return null;
  const signature = cookieValue.slice(lastColon + 1);
  const rest = cookieValue.slice(0, lastColon);
  const secondLastColon = rest.lastIndexOf(':');
  if (secondLastColon === -1) return null;
  const email = rest.slice(0, secondLastColon);
  const timestamp = rest.slice(secondLastColon + 1);
  if (!email || !timestamp || !signature) return null;
  const age = Date.now() - parseInt(timestamp, 10);
  if (Number.isNaN(age) || age < 0 || age > maxAge) return null;
  const expected = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${scope}:${email}:${timestamp}`)
    .digest('hex');
  if (!/^[0-9a-f]{64}$/.test(signature)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) return null;
  return email;
}
