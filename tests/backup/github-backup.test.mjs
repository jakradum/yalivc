// GitHub backup target with a mocked GitHub Git Data API and a mocked Supabase
// (REST tables, storage list + download). Fake data only.
// Run: node --test tests/backup/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const { runBackup } = await import('../../src/lib/backup/run.js');
const { gitBlobSha, githubClient, MAX_BLOB_BYTES } = await import('../../src/lib/backup/github.js');
const { keepAliveAndBackup } = await import('../../src/lib/backup/keepalive.js');

const SUPA = 'https://supabase.test';
const ENV = { SUPABASE_URL: SUPA, SUPABASE_SECRET_KEY: 'fake-key', GITHUB_BACKUP_TOKEN: 'fake-token', GITHUB_BACKUP_REPO: 'owner/private-docs' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const sha1 = (b) => createHash('sha1').update(b).digest('hex');

// ── fake Supabase ────────────────────────────────────────────────────────────
function fakeSupabase({ objects }) {
  // objects: { 'path/in/bucket': Buffer | { size } } ({ size } = listed but never downloadable)
  const downloads = [];
  const fileRows = Object.entries(objects)
    .filter(([p, b]) => Buffer.isBuffer(b) && !p.startsWith('archive/originals/'))
    .map(([p, b], i) => ({ asset_id: `file-${i}`, storage_path: p, sha1: sha1(b), size_bytes: b.length }));
  const tables = {
    sanity_docs: [{ id: 'doc-1', type: 'portalUser', doc: { name: 'Test User' } }, { id: 'doc-2', type: 'company', doc: {} }],
    sanity_files: fileRows,
    sync_runs: [],
    sync_types: [{ type: 'portalUser', enabled: false }],
    parity_diffs: [],
  };
  async function handle(url, opts) {
    const u = new URL(url);
    if (u.pathname.startsWith('/rest/v1/')) {
      const t = u.pathname.slice('/rest/v1/'.length);
      const from = Number(String(opts.headers?.Range || '0-').split('-')[0]);
      return json(from === 0 ? tables[t] || [] : []);
    }
    if (u.pathname === '/storage/v1/object/list/sanity-files') {
      const { prefix } = JSON.parse(opts.body);
      const pre = prefix ? `${prefix}/` : '';
      const seen = new Map();
      for (const [p, b] of Object.entries(objects)) {
        if (!p.startsWith(pre)) continue;
        const rest = p.slice(pre.length);
        const name = rest.split('/')[0];
        if (rest.includes('/')) seen.set(name, { name, id: null, metadata: null });
        else seen.set(name, { name, id: `id-${p}`, metadata: { size: Buffer.isBuffer(b) ? b.length : b.size, mimetype: 'application/pdf' } });
      }
      return json([...seen.values()]);
    }
    if (u.pathname.startsWith('/storage/v1/object/sanity-files/')) {
      const p = decodeURIComponent(u.pathname.slice('/storage/v1/object/sanity-files/'.length));
      downloads.push(p);
      const b = objects[p];
      return Buffer.isBuffer(b) ? new Response(b) : new Response('no', { status: 404 });
    }
    return new Response('unexpected supabase call', { status: 500 });
  }
  return { handle, downloads };
}

// ── fake GitHub (one repo, branch main) ──────────────────────────────────────
function fakeGitHub({ files = { 'deck.html': 'deck' } } = {}) {
  const blobs = new Map(); // sha → Buffer
  const trees = new Map(); // id → Map(path → { sha, size })
  const commits = new Map(); // sha → { tree, parents, message }
  const calls = [];
  let n = 0;
  const state = { ref: null, raceOnce: 0, dropOnRead: null };
  const putBlob = (buf) => { const s = gitBlobSha(buf); blobs.set(s, buf); return s; };
  const mkTree = (map) => { const id = `t${++n}`; trees.set(id, map); return id; };
  const mkCommit = (tree, parents, message) => { const s = createHash('sha1').update(`c${++n}`).digest('hex'); commits.set(s, { tree, parents, message }); return s; };
  const init = new Map(Object.entries(files).map(([p, c]) => { const b = Buffer.from(c); return [p, { sha: putBlob(b), size: b.length }]; }));
  state.ref = mkCommit(mkTree(init), [], 'init');

  // Someone else pushes to main (outside lp-data-backups/).
  function foreignPush(path) {
    const base = trees.get(commits.get(state.ref).tree);
    const next = new Map(base);
    const b = Buffer.from(`other ${n}`);
    next.set(path, { sha: putBlob(b), size: b.length });
    state.ref = mkCommit(mkTree(next), [state.ref], 'other');
  }

  async function handle(url, opts = {}) {
    const u = new URL(url);
    const m = opts.method || 'GET';
    const p = u.pathname.replace('/repos/owner/private-docs', '');
    calls.push(`${m} ${p}`);
    assert.equal(opts.headers.Authorization, 'Bearer fake-token');
    const body = opts.body ? JSON.parse(opts.body) : null;
    if (m === 'GET' && p === '/git/ref/heads/main') return json({ object: { sha: state.ref } });
    if (m === 'GET' && p.startsWith('/git/commits/')) return json({ tree: { sha: commits.get(p.split('/').pop()).tree } });
    if (m === 'GET' && p.startsWith('/git/trees/')) {
      const id = decodeURIComponent(p.split('/').pop());
      if (id.startsWith('sub:')) {
        const map = trees.get(id.slice(4));
        const out = [];
        for (const [path, v] of map) {
          if (!path.startsWith('lp-data-backups/')) continue;
          if (state.dropOnRead && path.endsWith(state.dropOnRead)) continue;
          out.push({ path: path.slice('lp-data-backups/'.length), type: 'blob', sha: v.sha, size: v.size });
        }
        return json({ tree: out, truncated: false });
      }
      const map = trees.get(id);
      const top = new Map();
      for (const [path, v] of map) {
        const [first] = path.split('/');
        if (path.includes('/')) top.set(first, { path: first, type: 'tree', sha: `sub:${id}` });
        else top.set(first, { path: first, type: 'blob', sha: v.sha, size: v.size });
      }
      return json({ tree: [...top.values()], truncated: false });
    }
    if (m === 'POST' && p === '/git/blobs') return json({ sha: putBlob(Buffer.from(body.content, 'base64')) }, 201);
    if (m === 'POST' && p === '/git/trees') {
      const next = new Map(trees.get(body.base_tree));
      for (const e of body.tree) next.set(e.path, { sha: e.sha, size: blobs.get(e.sha).length });
      return json({ sha: mkTree(next) }, 201);
    }
    if (m === 'POST' && p === '/git/commits') return json({ sha: mkCommit(body.tree, body.parents, body.message) }, 201);
    if (m === 'PATCH' && p === '/git/refs/heads/main') {
      assert.equal(body.force, false);
      if (state.raceOnce > 0) { state.raceOnce--; foreignPush(`other-${n}.html`); }
      if (commits.get(body.sha).parents[0] !== state.ref) return json({ message: 'Update is not a fast forward' }, 422);
      state.ref = body.sha;
      return json({ object: { sha: body.sha } });
    }
    return json({ message: 'Not Found' }, 404);
  }
  const headTree = () => trees.get(commits.get(state.ref).tree);
  return { handle, calls, state, commits, headTree, foreignPush };
}

function setup({ objects, files } = {}) {
  const supa = fakeSupabase({ objects: objects || { 'file-a-pdf': Buffer.from('%PDF a'), 'archive/file-b-pdf': Buffer.from('%PDF bb'), 'archive/originals/big.pdf': Buffer.from('%PDF original') } });
  const gh = fakeGitHub({ files });
  const fetchImpl = (url, opts) => (String(url).startsWith(SUPA) ? supa.handle(url, opts) : gh.handle(url, opts));
  let t = Date.parse('2026-11-09T06:30:00Z');
  const run = (extra = {}) => runBackup({ target: 'github', env: ENV, fetchImpl, now: () => (t += 10), ...extra });
  return { supa, gh, run };
}

test('one commit per run, only under lp-data-backups/, other files untouched', async () => {
  const { gh, run } = setup();
  const before = gh.state.ref;
  const r = await run();
  assert.equal(r.ok, true);
  assert.equal(r.complete, true);
  assert.equal(r.verified, true);
  assert.deepEqual(r.files, { total: 3, kept: 0, copied: 3, pending: 0 });
  assert.equal(gh.calls.filter((c) => c === 'POST /git/commits').length, 1);
  assert.equal(gh.calls.filter((c) => c === 'PATCH /git/refs/heads/main').length, 1);
  const c = gh.commits.get(gh.state.ref);
  assert.deepEqual(c.parents, [before]);
  assert.equal(c.message, 'backup: 2026-11-09T06-30 (2 docs, 3 new files)');
  assert.equal(r.commit, gh.state.ref);
  const paths = [...gh.headTree().keys()].sort();
  assert.deepEqual(paths, [
    'deck.html',
    'lp-data-backups/2026-11-09T06-30/manifest.json',
    'lp-data-backups/2026-11-09T06-30/parity_diffs.jsonl',
    'lp-data-backups/2026-11-09T06-30/sanity_docs.jsonl',
    'lp-data-backups/2026-11-09T06-30/sanity_files.jsonl',
    'lp-data-backups/2026-11-09T06-30/sync_runs.jsonl',
    'lp-data-backups/2026-11-09T06-30/sync_types.jsonl',
    'lp-data-backups/README.md',
    'lp-data-backups/files/archive/file-b-pdf',
    'lp-data-backups/files/archive/originals/big.pdf',
    'lp-data-backups/files/file-a-pdf',
  ]);
  assert.equal(gh.headTree().get('deck.html').size, 4);
});

test('second run: existing files skipped (no download, no blob), README unchanged, still one commit', async () => {
  const { gh, supa, run } = setup();
  await run();
  const downloads = supa.downloads.length;
  const blobsBefore = gh.calls.filter((c) => c === 'POST /git/blobs').length;
  gh.calls.length = 0;
  const r = await run({ now: (() => { let t = Date.parse('2026-11-12T18:05:00Z'); return () => (t += 10); })() });
  assert.deepEqual(r.files, { total: 3, kept: 3, copied: 0, pending: 0 });
  assert.equal(supa.downloads.length, downloads);
  assert.equal(gh.calls.filter((c) => c === 'POST /git/commits').length, 1);
  // only the new run folder: 5 table files + manifest (README and files unchanged)
  assert.equal(gh.calls.filter((c) => c === 'POST /git/blobs').length, 6);
  assert.ok(blobsBefore > 6);
  assert.match(gh.commits.get(gh.state.ref).message, /^backup: 2026-11-12T18-05 \(2 docs, 0 new files\)$/);
});

test('ref race: rebuilds on the new head and retries once, keeping the other push', async () => {
  const { gh, run } = setup();
  gh.state.raceOnce = 1;
  const r = await run();
  assert.equal(r.ok, true);
  assert.equal(gh.calls.filter((c) => c === 'PATCH /git/refs/heads/main').length, 2);
  assert.equal(gh.calls.filter((c) => c === 'POST /git/commits').length, 2);
  const paths = [...gh.headTree().keys()];
  assert.ok(paths.some((p) => /^other-\d+\.html$/.test(p)), 'the concurrent push survives');
  assert.ok(paths.includes('lp-data-backups/README.md'));
  assert.ok(paths.includes('deck.html'));
});

test('ref race twice: fails loudly, nothing forced', async () => {
  const { gh, run } = setup();
  gh.state.raceOnce = 2;
  const head0 = gh.state.ref;
  await assert.rejects(run(), /moved during the backup \(422\)/);
  assert.notEqual(gh.state.ref, head0); // only the two foreign pushes moved it
  assert.ok(![...gh.headTree().keys()].some((p) => p.startsWith('lp-data-backups/')));
});

test('size limit: an object over 95 MB is never downloaded, the rest is committed, then the run fails loudly', async () => {
  const { gh, supa, run } = setup({ objects: { 'file-a-pdf': Buffer.from('%PDF a'), 'archive/originals/huge.pdf': { size: MAX_BLOB_BYTES + 1 } } });
  await assert.rejects(run(), /1 bucket file\(s\) over the 95 MB limit were NOT backed up: files\/archive\/originals\/huge\.pdf/);
  assert.ok(!supa.downloads.includes('archive/originals/huge.pdf'));
  const tree = gh.headTree();
  assert.ok(tree.has('lp-data-backups/files/file-a-pdf'));
  assert.ok(!tree.has('lp-data-backups/files/archive/originals/huge.pdf'));
  const manifestPath = [...tree.keys()].find((p) => p.endsWith('manifest.json'));
  assert.ok(manifestPath);
});

test('upload() refuses a buffer over the limit', async () => {
  const gh = fakeGitHub();
  const client = githubClient({ token: 'fake-token', repo: 'owner/private-docs', fetchImpl: gh.handle });
  await assert.rejects(client.upload('files/x.pdf', Buffer.alloc(MAX_BLOB_BYTES + 1)), /up to 95 MB/);
  assert.equal(gh.calls.filter((c) => c === 'POST /git/blobs').length, 0);
});

test('verification failure: a file missing from the committed tree fails the run', async () => {
  const { gh, run } = setup();
  gh.state.dropOnRead = 'files/archive/file-b-pdf';
  await assert.rejects(run(), /Verification of files\/ failed: archive\/file-b-pdf missing/);
});

test('time box: files past the per-run cap are pending and picked up next run', async () => {
  const { run } = setup();
  const r1 = await run({ maxFiles: 1 });
  assert.equal(r1.complete, false);
  assert.deepEqual(r1.files, { total: 3, kept: 0, copied: 1, pending: 2 });
  const r2 = await run({ now: (() => { let t = Date.parse('2026-11-12T18:05:00Z'); return () => (t += 10); })() });
  assert.equal(r2.complete, true);
  assert.deepEqual(r2.files, { total: 3, kept: 1, copied: 2, pending: 0 });
});

test('keep-alive route: no GITHUB_BACKUP_TOKEN → ping only, backup "not configured"', async () => {
  let ran = false;
  const out = await keepAliveAndBackup({
    env: { SUPABASE_URL: SUPA },
    keepAlive: async () => ({ pinged: true, rows: 1 }),
    runBackup: async () => { ran = true; },
    notifyFailure: async () => true,
  });
  assert.equal(ran, false);
  assert.deepEqual(out, { status: 200, body: { ok: true, pinged: true, rows: 1, backup: 'not configured' } });
});

test('keep-alive route: backup runs after the ping; a failure is emailed and still answers 200', async () => {
  const order = [];
  const ok = await keepAliveAndBackup({
    env: ENV,
    keepAlive: async () => { order.push('ping'); return { pinged: true, rows: 1 }; },
    runBackup: async (o) => { order.push(`backup:${o.target}`); return { ok: true, commit: 'abc' }; },
    notifyFailure: async () => true,
  });
  assert.deepEqual(order, ['ping', 'backup:github']);
  assert.equal(ok.body.backup.commit, 'abc');

  const mails = [];
  const bad = await keepAliveAndBackup({
    env: ENV,
    keepAlive: async () => ({ pinged: true, rows: 1 }),
    runBackup: async () => { throw new Error('boom'); },
    notifyFailure: async (msg, o) => { mails.push([msg, o.target]); return true; },
    log: { error() {} },
  });
  assert.equal(bad.status, 200);
  assert.deepEqual(bad.body.backup, { ok: false, error: 'Backup failed; see logs.', emailed: true });
  assert.deepEqual(mails, [['boom', 'github']]);
});

test('keep-alive route: a failed ping throws before any backup', async () => {
  let ran = false;
  await assert.rejects(keepAliveAndBackup({
    env: ENV,
    keepAlive: async () => { throw new Error('supabase down'); },
    runBackup: async () => { ran = true; },
    notifyFailure: async () => true,
  }), /supabase down/);
  assert.equal(ran, false);
});
