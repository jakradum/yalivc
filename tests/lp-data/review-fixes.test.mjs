// Mocked-fetch tests for the lp-data review fixes: write ownership via sync_types,
// supaAll paging at exactly one full page, HMAC-keyed parity hashes.
// Run: node --test tests/lp-data/*.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_SECRET_KEY = 'test-key';
process.env.PORTAL_AUTH_SECRET = 'test-hmac-secret';

const { makeWrite, writeOwner, resetWriteOwnerCache } = await import('../../src/lib/lp-data/write-owner.js');
const { supaAll } = await import('../../src/lib/lp-data/rest.js');
const { compareAndRecord } = await import('../../src/lib/lp-data/shadow.js');

let handler;
let requests;
globalThis.fetch = async (url, opts = {}) => {
  requests.push({ url: String(url), opts });
  return handler(new URL(url), opts);
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  requests = [];
  resetWriteOwnerCache();
});

function stubWrite(type) {
  const calls = [];
  const fn = makeWrite('w', type, async (...a) => { calls.push(['sanity', ...a]); return 'S'; },
    async (...a) => { calls.push(['supabase', ...a]); return 'B'; }, () => 'supabase');
  return { fn, calls };
}

test('enabled = true: supabase mode writes to Sanity', async () => {
  handler = () => json([{ type: 'portalUser', enabled: true }]);
  const { fn, calls } = stubWrite('portalUser');
  assert.equal(await fn('id1'), 'S');
  assert.deepEqual(calls, [['sanity', 'id1']]);
});

test('no sync_types row: supabase mode writes to Sanity', async () => {
  handler = () => json([{ type: 'other', enabled: false }]);
  const { fn, calls } = stubWrite('lpDownloadConsent');
  assert.equal(await fn({ a: 1 }), 'S');
  assert.equal(calls[0][0], 'sanity');
});

test('enabled = false: supabase mode writes to sanity_docs', async () => {
  handler = () => json([{ type: 'lpPortalFeedback', enabled: false }, { type: 'portalUser', enabled: true }]);
  const { fn, calls } = stubWrite('lpPortalFeedback');
  assert.equal(await fn({ a: 1 }), 'B');
  assert.equal(calls[0][0], 'supabase');
});

test('sync_types unreadable: falls back to Sanity and logs one data-free line', async () => {
  handler = () => new Response('secret detail', { status: 500 });
  const warn = console.warn; const lines = [];
  console.warn = (...a) => lines.push(a.join(' '));
  try {
    const { fn, calls } = stubWrite('domainPrivilege');
    assert.equal(await fn({ _id: 'x' }, 'someone@example.com'), 'S');
    assert.equal(calls[0][0], 'sanity');
  } finally { console.warn = warn; }
  assert.equal(lines.length, 1);
  assert.ok(!lines[0].includes('secret detail') && !lines[0].includes('example.com'));
});

test('sanity and shadow mode never read sync_types', async () => {
  handler = () => { throw new Error('should not be called'); };
  for (const mode of ['sanity', 'shadow']) {
    const calls = [];
    const fn = makeWrite('w', 'portalUser', async () => { calls.push('sanity'); }, async () => { calls.push('supabase'); }, () => mode);
    await fn();
    assert.deepEqual(calls, ['sanity']);
  }
  assert.equal(requests.length, 0);
});

test('sync_types is cached for at most 30 seconds', async () => {
  handler = () => json([{ type: 'portalUser', enabled: false }]);
  const realNow = Date.now; let now = 1_000_000;
  Date.now = () => now;
  try {
    assert.equal(await writeOwner('portalUser'), 'supabase');
    handler = () => json([{ type: 'portalUser', enabled: true }]);
    now += 29_000;
    assert.equal(await writeOwner('portalUser'), 'supabase'); // cached
    now += 2_000;
    assert.equal(await writeOwner('portalUser'), 'sanity'); // refreshed after 30 s
  } finally { Date.now = realNow; }
  assert.equal(requests.filter((r) => r.url.includes('/sync_types')).length, 2);
  assert.ok(requests.every((r) => r.opts.cache === 'no-store'));
});

test('supaAll: exactly 1,000 rows then 416 ends cleanly', async () => {
  const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
  handler = (u, opts) => (opts.headers.Range === '0-999' ? json(rows, 206) : new Response('{"code":"PGRST103"}', { status: 416 }));
  const out = await supaAll('/rest/v1/sanity_docs?select=doc&type=eq.x');
  assert.equal(out.length, 1000);
});

test('supaAll: 416 on the first page is still an error', async () => {
  handler = () => new Response('', { status: 416 });
  await assert.rejects(supaAll('/rest/v1/sanity_docs?select=doc'), (e) => e.status === 416);
});

test('parity hashes are HMAC-SHA256 keyed by PORTAL_AUTH_SECRET, never plain values', async () => {
  let posted;
  handler = (u, opts) => { posted = JSON.parse(opts.body); return new Response('', { status: 201 }); };
  await compareAndRecord('fn', ['code-123456'], { inviteCode: '123456' }, async () => ({ inviteCode: '654321' }));
  const hmac = (s) => crypto.createHmac('sha256', 'test-hmac-secret').update(s).digest('hex');
  const plain = (s) => crypto.createHash('sha256').update(s).digest('hex');
  assert.equal(posted.length, 1);
  assert.equal(posted[0].sanity_hash, hmac('"123456"'));
  assert.equal(posted[0].supabase_hash, hmac('"654321"'));
  assert.equal(posted[0].input_hash, hmac('["code-123456"]'));
  assert.notEqual(posted[0].sanity_hash, plain('"123456"'));
  assert.ok(!JSON.stringify(posted).includes('123456'));
});

test('no PORTAL_AUTH_SECRET: nothing is recorded', async () => {
  const saved = process.env.PORTAL_AUTH_SECRET;
  delete process.env.PORTAL_AUTH_SECRET;
  handler = () => { throw new Error('should not be called'); };
  try {
    await compareAndRecord('fn', [], { a: 1 }, async () => ({ a: 2 }));
  } finally { process.env.PORTAL_AUTH_SECRET = saved; }
  assert.equal(requests.length, 0);
});

test('lp-data end to end: Supabase-owned type is written to sanity_docs', async () => {
  const lp = await import('../../src/lib/lp-data.js');
  const saved = process.env.LP_DATA_SOURCE;
  process.env.LP_DATA_SOURCE = 'supabase';
  let inserted;
  handler = (u, opts) => {
    if (u.pathname.endsWith('/sync_types')) return json([{ type: 'lpPortalFeedback', enabled: false }]);
    if (u.pathname.endsWith('/sanity_docs') && opts.method === 'POST') { inserted = JSON.parse(opts.body); return new Response('', { status: 201 }); }
    throw new Error(`unexpected ${opts.method} ${u.pathname}`);
  };
  try {
    const doc = await lp.createPortalFeedback({ email: 'x@example.com', npsScore: 9 });
    assert.equal(inserted.type, 'lpPortalFeedback');
    assert.equal(inserted.id, doc._id);
    assert.equal(inserted.doc._type, 'lpPortalFeedback');
  } finally { process.env.LP_DATA_SOURCE = saved; }
});
