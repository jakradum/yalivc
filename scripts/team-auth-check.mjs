// Tests for the Microsoft token verification + team session — plain Node:
//   PORTAL_AUTH_SECRET=test node scripts/team-auth-check.mjs
process.env.PORTAL_AUTH_SECRET ||= 'test-secret';
import crypto from 'crypto';
import { verifyIdToken, verifyViaGraph, verifyMicrosoftLogin, TENANT_ID, _resetKeyCache } from '../src/lib/microsoftAuth.js';
import { signTeamSession, verifyTeamSession, canAccess, isYaliEmail } from '../src/lib/teamSession.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => (c ? pass++ : (fail++, console.log('  FAIL', n, x)));
const rejects = async (n, p, has) => { try { await p; fail++; console.log('  FAIL', n, '(accepted)'); } catch (e) { e.message.includes(has) ? pass++ : (fail++, console.log('  FAIL', n, '→', e.message)); } };

// A throwaway signing key + a fake "Microsoft JWKS" served through an injected fetch.
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const fetchImpl = async (url, opts) => {
  if (String(url).includes('/discovery/v2.0/keys')) return { ok: true, json: async () => ({ keys: [jwk] }) };
  if (String(url).includes('graph.microsoft.com')) {
    const t = opts?.headers?.Authorization;
    if (t === 'Bearer good') return { ok: true, json: async () => ({ userPrincipalName: 'Kram@yali.vc' }) };
    if (t === 'Bearer guest') return { ok: true, json: async () => ({ userPrincipalName: 'x_other.com#EXT#@yali.onmicrosoft.com' }) };
    if (t === 'Bearer spoof') return { ok: true, json: async () => ({ userPrincipalName: 'x@evil.com', mail: 'ceo@yali.vc' }) };
    return { ok: false };
  }
  throw new Error('unexpected fetch ' + url);
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const mint = (claims, { key = privateKey, kid = 'k1', alg = 'RS256' } = {}) => {
  const head = b64({ alg, kid, typ: 'JWT' }); const body = b64(claims);
  return `${head}.${body}.${crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), key).toString('base64url')}`;
};
const now = Math.floor(Date.now() / 1000);
const base = { tid: TENANT_ID, iss: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`, exp: now + 600, nbf: now - 10, preferred_username: 'Kram@yali.vc', aud: 'app' };

console.log('Microsoft ID token');
_resetKeyCache();
ok('valid token → lowercase email', (await verifyIdToken(mint(base), { fetchImpl })) === 'kram@yali.vc');
ok('uses `email` claim when present', (await verifyIdToken(mint({ ...base, email: 'Sunil@yali.vc', preferred_username: undefined }), { fetchImpl })) === 'sunil@yali.vc');
await rejects('wrong tenant', verifyIdToken(mint({ ...base, tid: '00000000-0000-0000-0000-000000000000' }), { fetchImpl }), 'Not a Yali tenant');
await rejects('wrong issuer', verifyIdToken(mint({ ...base, iss: 'https://login.microsoftonline.com/other/v2.0' }), { fetchImpl }), 'Not a Yali tenant');
await rejects('expired', verifyIdToken(mint({ ...base, exp: now - 3600 }), { fetchImpl }), 'expired');
await rejects('not yet valid', verifyIdToken(mint({ ...base, nbf: now + 3600 }), { fetchImpl }), 'not yet valid');
await rejects('signed by someone else', verifyIdToken(mint(base, { key: other.privateKey }), { fetchImpl }), 'signature');
await rejects('unknown key id', verifyIdToken(mint(base, { kid: 'nope' }), { fetchImpl }), 'Unknown signing key');
await rejects('alg none/HS256', verifyIdToken(mint(base, { alg: 'HS256' }), { fetchImpl }), 'algorithm');
await rejects('not @yali.vc', verifyIdToken(mint({ ...base, preferred_username: 'x@evil.com' }), { fetchImpl }), 'Not a Yali account');
await rejects('wrong audience when pinned', verifyIdToken(mint(base), { fetchImpl, clientId: 'different' }), 'different app');
ok('audience matches when pinned', (await verifyIdToken(mint(base), { fetchImpl, clientId: 'app' })) === 'kram@yali.vc');
await rejects('garbage', verifyIdToken('a.b', { fetchImpl }), 'Malformed');

console.log('Graph fallback');
ok('yali UPN accepted', (await verifyViaGraph('good', { fetchImpl })) === 'kram@yali.vc');
await rejects('other-tenant guest rejected', verifyViaGraph('guest', { fetchImpl }), 'Not a Yali account');
await rejects('spoofed mail attribute rejected (UPN checked, not mail)', verifyViaGraph('spoof', { fetchImpl }), 'Not a Yali account');
await rejects('bad token rejected by Microsoft', verifyViaGraph('nope', { fetchImpl }), 'did not accept');

console.log('Combined');
ok('id token first', (await verifyMicrosoftLogin({ idToken: mint(base), accessToken: 'good' }, { fetchImpl })).via === 'id-token');
ok('falls back to Graph when the id token fails', (await verifyMicrosoftLogin({ idToken: mint({ ...base, exp: now - 9999 }), accessToken: 'good' }, { fetchImpl })).via === 'graph');
await rejects('both fail → both reasons', verifyMicrosoftLogin({ idToken: 'x.y.z', accessToken: 'nope' }, { fetchImpl }), 'graph:');
await rejects('nothing supplied', verifyMicrosoftLogin({}, { fetchImpl }), 'No Microsoft token');

console.log('Team session');
const s = signTeamSession('Kram@yali.vc');
ok('round-trips (lowercased)', verifyTeamSession(s) === 'kram@yali.vc');
ok('tampered email rejected', verifyTeamSession(s.replace('kram', 'evil')) === null);
ok('tampered signature rejected', verifyTeamSession(s.slice(0, -2) + '00') === null);
ok('expired rejected', verifyTeamSession(signTeamSession('a@yali.vc', Date.now() - 8 * 24 * 3600 * 1000)) === null);
ok('LP-portal style cookie (no "team:" domain) rejected', (() => { const e = 'lp@yali.vc', t = Date.now(); const sig = crypto.createHmac('sha256', process.env.PORTAL_AUTH_SECRET).update(`${e}:${t}`).digest('hex'); return verifyTeamSession(`${e}:${t}:${sig}`) === null; })());
ok('garbage rejected', verifyTeamSession('nope') === null && verifyTeamSession('') === null);
ok('only @yali.vc may access', canAccess('builder', 'a@yali.vc') && !canAccess('builder', 'a@gmail.com') && isYaliEmail('A@YALI.VC'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
