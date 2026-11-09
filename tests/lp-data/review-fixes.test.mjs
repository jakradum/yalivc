// Mocked-fetch tests for the lp-data review fixes: write ownership via sync_types,
// supaAll keyset paging (full page, short pages, concurrent writes), HMAC-keyed parity hashes.
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

// A tiny PostgREST: `order=id.asc`, `limit`, `id=gt.<x>`, and a db-max-rows cap.
function keysetTable(rows, { maxRows = 1000, beforePage } = {}) {
  return (u) => {
    beforePage?.(u);
    const sp = u.searchParams;
    assert.equal(sp.get('order'), 'id.asc');
    const gt = sp.get('id')?.replace(/^gt\./, '');
    const limit = Math.min(Number(sp.get('limit')), maxRows);
    const sorted = [...rows()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return json(sorted.filter((r) => gt === undefined || r.id > gt).slice(0, limit));
  };
}
const ids = (n, prefix = 'r') => Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${String(i).padStart(5, '0')}` }));

test('supaAll: exactly 1,000 rows then an empty page ends cleanly', async () => {
  const rows = ids(1000);
  handler = keysetTable(() => rows);
  const out = await supaAll('/rest/v1/sanity_docs?select=id,doc&type=eq.x');
  assert.equal(out.length, 1000);
  assert.equal(requests.length, 2);
  assert.ok(requests[1].url.includes('id=gt.r-00999'));
});

test('supaAll: a short page is not the end (db-max-rows below the page size)', async () => {
  const rows = ids(801);
  handler = keysetTable(() => rows, { maxRows: 500 });
  const out = await supaAll('/rest/v1/sanity_docs?select=id,doc&type=eq.x');
  assert.equal(out.length, 801);
  assert.equal(new Set(out.map((r) => r.id)).size, 801);
});

test('supaAll: rows inserted or deleted between pages are never skipped or repeated', async () => {
  let rows = ids(1500);
  let page = 0;
  handler = keysetTable(() => rows, {
    beforePage: () => {
      if (++page !== 2) return;
      rows = rows.filter((r) => r.id !== 'r-00010'); // delete before the boundary
      rows.push({ id: 'r-00000a' }); // insert before the boundary
    },
  });
  const out = (await supaAll('/rest/v1/sanity_docs?select=id,doc&type=eq.x')).map((r) => r.id);
  assert.equal(out.length, new Set(out).size);
  assert.ok(out.includes('r-01000') && out.includes('r-01499'));
});

test('supaAll: errors are thrown, and a path with its own order/limit is refused', async () => {
  handler = () => new Response('', { status: 416 });
  await assert.rejects(supaAll('/rest/v1/sanity_docs?select=id,doc'), (e) => e.status === 416);
  await assert.rejects(supaAll('/rest/v1/sanity_docs?select=id&order=id'), /must not set order/);
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

test('Ctx.type: a loader that returns a document twice yields it once', async () => {
  const lp = await import('../../src/lib/lp-data.js');
  const saved = process.env.LP_DATA_SOURCE;
  process.env.LP_DATA_SOURCE = 'supabase';
  const c = { _id: 'company-a', _type: 'company', name: 'A', slug: { current: 'a' }, investmentStatus: 'active' };
  lp.setDocLoader({ byType: async (t) => (t === 'company' ? [c, { ...c }, { ...c, _id: 'company-b', slug: { current: 'b' } }] : []), byIds: async () => [] });
  try {
    assert.deepEqual((await lp.getAllLPInvestmentSlugs()).map((x) => x.slug ?? x), ['a', 'b']);
  } finally { lp.resetDocLoader(); process.env.LP_DATA_SOURCE = saved; }
});

test('drafts and versions: never served by Ctx or the default loader', async () => {
  const lp = await import('../../src/lib/lp-data.js');
  const { defaultLoader } = await import('../../src/lib/lp-data/loader.js');
  const saved = process.env.LP_DATA_SOURCE;
  process.env.LP_DATA_SOURCE = 'supabase';
  const co = (id, slug) => ({ _id: id, _type: 'company', name: slug, slug: { current: slug }, investmentStatus: 'active' });
  const docs = [co('company-a', 'a'), co('drafts.company-a', 'a-draft'), co('versions.r1.company-b', 'b-version')];
  lp.setDocLoader({ byType: async (t) => docs.filter((d) => d._type === t), byIds: async () => [] });
  try {
    assert.deepEqual((await lp.getAllLPInvestmentSlugs()).map((x) => x.slug ?? x), ['a']);
  } finally { lp.resetDocLoader(); process.env.LP_DATA_SOURCE = saved; }

  handler = keysetTable(() => docs.map((d) => ({ id: d._id, doc: d })));
  assert.deepEqual((await defaultLoader.byType('company')).map((d) => d._id), ['company-a']);
  handler = (u) => json(docs.filter((d) => u.searchParams.get('id').includes(encodeURIComponent(d._id))).map((d) => ({ id: d._id, doc: d })));
  requests = [];
  assert.deepEqual((await defaultLoader.byIds(['drafts.company-a', 'company-a'])).map((d) => d._id), ['company-a']);
  assert.ok(requests.every((r) => !r.url.includes('drafts.')));
});
