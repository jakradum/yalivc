import crypto from 'crypto';

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;

/**
 * Verifies a portal-session or dataroom-session cookie value.
 * Cookie format: email:timestamp:hex-signature
 * Both portals sign with PORTAL_AUTH_SECRET.
 *
 * Returns the email string if the signature is valid.
 * Returns null if the cookie is absent, malformed, or the signature fails.
 */
export function verifySession(cookieValue) {
  if (!cookieValue || !AUTH_SECRET) return null;
  const lastColon = cookieValue.lastIndexOf(':');
  if (lastColon === -1) return null;
  const signature = cookieValue.slice(lastColon + 1);
  const rest = cookieValue.slice(0, lastColon);
  const secondLastColon = rest.lastIndexOf(':');
  if (secondLastColon === -1) return null;
  const email = rest.slice(0, secondLastColon);
  const timestamp = rest.slice(secondLastColon + 1);
  if (!email || !timestamp || !signature) return null;
  const expected = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${email}:${timestamp}`)
    .digest('hex');
  // signature and expected are both 64-char hex strings
  const a = Buffer.from(signature.padEnd(64, '0'), 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return email;
}
