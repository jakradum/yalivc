// Emailed sign-in codes, kept in Supabase (table and rules: supabase/migrations/0004_sign_in_codes.sql).
// Only HMACs of the email and the code are stored; the limits are counted in the
// database, so a server restart or a second server instance cannot reset them.
import crypto from 'crypto';
import { supa } from '../lp-data/rest.js';

function hmac(text) {
  const secret = process.env.PORTAL_AUTH_SECRET;
  if (!secret) throw new Error('PORTAL_AUTH_SECRET is required');
  return crypto.createHmac('sha256', secret).update(text).digest('hex');
}

export const emailHash = (scope, email) => hmac(`sign-in-email:${scope}:${email}`);
export const codeHash = (scope, email, code) => hmac(`sign-in-code:${scope}:${email}:${code}`);

export const newCode = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

async function rpc(fn, scope, email, code) {
  const { rows } = await supa(`/rest/v1/rpc/${fn}`, {
    method: 'POST',
    body: { p_scope: scope, p_email_hash: emailHash(scope, email), p_code_hash: code ? codeHash(scope, email, code) : null },
  });
  return rows;
}

// code null: the email has no access. A row is still recorded so the limits and
// replies match a real LP's. Returns { status: 'issued' | 'limit' | 'locked', ... }.
export const issueCode = (scope, email, code) => rpc('sign_in_issue', scope, email, code);

// Returns { status: 'ok' | 'wrong' | 'dead' | 'locked' | 'expired', ... }.
export const checkCode = (scope, email, code) => rpc('sign_in_check', scope, email, code);
