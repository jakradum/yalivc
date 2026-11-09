// GitHub backup target (per-record history) with a mocked GitHub Git Data API
// and a mocked Supabase (REST tables, storage list + download). Fake data only.
// Run: node --test tests/backup/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENV, SUPA, setup as baseSetup, fakeGitHub } from './fakes.mjs';

const { runBackup } = await import('../../src/lib/backup/run.js');
const { githubClient, MAX_BLOB_BYTES } = await import('../../src/lib/backup/github.js');
const { keepAliveAndBackup } = await import('../../src/lib/backup/keepalive.js');

function setup(opts) {
  const s = baseSetup(opts);
  let t = Date.parse('2026-11-09T06:30:00Z');
  const run = (extra = {}) => runBackup({ target: 'github', env: ENV, fetchImpl: s.fetchImpl, now: () => (t += 10), ...extra });
  return { ...s, run };
}

test('first run: one commit, one file per record, only under lp-data-backups/, other files untouched', async () => {
  const { gh, run } = setup();
  const before = gh.state.ref;
  const r = await run();
  assert.equal(r.ok, true);
  assert.equal(r.complete, true);
  assert.equal(r.verified, true);
  assert.deepEqual(r.files, { total: 3, kept: 0, copied: 3, pending: 0 });
  assert.deepEqual(r.records, { added: 2, changed: 0, removed: 0, byType: { company: 1, portalUser: 1 } });
  assert.equal(gh.calls.filter((c) => c === 'POST /git/commits').length, 1);
  assert.equal(gh.calls.filter((c) => c === 'PATCH /git/refs/heads/main').length, 1);
  // record files go inline in the tree request: blobs only for the 3 bucket files
  assert.equal(gh.calls.filter((c) => c === 'POST /git/blobs').length, 3);
  const c = gh.commits.get(gh.state.ref);
  assert.deepEqual(c.parents, [before]);
  assert.match(c.message, /^portal changes: 2 records \(company 1, portalUser 1\)\n\nadded 2, changed 0, removed 0\ntables: parity_diffs, sanity_files, sync_runs, sync_types\nnew bucket files: 3$/);
  assert.equal(r.commit, gh.state.ref);
  const paths = [...gh.headTree().keys()].sort();
  assert.deepEqual(paths, [
    'deck.html',
    'lp-data-backups/README.md',
    'lp-data-backups/files/archive/file-b-pdf',
    'lp-data-backups/files/archive/originals/big.pdf',
    'lp-data-backups/files/file-a-pdf',
    'lp-data-backups/records/INDEX.md',
    'lp-data-backups/records/_tables/parity_diffs.json',
    'lp-data-backups/records/_tables/sanity_files.json',
    'lp-data-backups/records/_tables/sync_runs.json',
    'lp-data-backups/records/_tables/sync_types.json',
    'lp-data-backups/records/company/co-1.json',
    'lp-data-backups/records/portalUser/user-1.json',
  ]);
  assert.equal(gh.headTree().get('deck.html').size, 4);
  assert.ok(!paths.some((p) => /\d{4}-\d{2}-\d{2}T/.test(p)), 'no dated snapshot folder');
  // the record file: the doc, keys sorted recursively, 2-space indent, trailing newline
  assert.equal(gh.read('lp-data-backups/records/company/co-1.json'),
    '{\n  "_id": "co-1",\n  "_rev": "r1",\n  "_type": "company",\n  "name": "Acme Widgets",\n  "order": 2,\n  "slug": {\n    "_type": "slug",\n    "current": "acme"\n  }\n}\n');
});

test('second run with nothing changed: no commit, no blobs, no downloads; changed 0', async () => {
  const { gh, supa, run } = setup();
  await run();
  const head = gh.state.ref;
  const downloads = supa.downloads.length;
  gh.calls.length = 0;
  const r = await run();
  assert.equal(r.ok, true);
  assert.equal(r.changed, 0);
  assert.equal(r.commit, null);
  assert.deepEqual(r.files, { total: 3, kept: 3, copied: 0, pending: 0 });
  assert.equal(gh.state.ref, head);
  assert.equal(supa.downloads.length, downloads);
  assert.deepEqual(gh.calls.filter((c) => c.startsWith('POST') || c.startsWith('PATCH')), []);
});

test('ref race: re-reads Supabase, re-diffs on the new head and retries once, keeping the other push', async () => {
  const { gh, supa, run } = setup();
  gh.state.raceOnce = 1;
  // the race also changes a record in Supabase: the retry must commit the new version
  gh.state.onRace = () => { gh.foreignPush('other.html'); supa.tables.sanity_docs[1].doc.order = 3; };
  const r = await run();
  assert.equal(r.ok, true);
  assert.equal(gh.calls.filter((c) => c === 'PATCH /git/refs/heads/main').length, 2);
  assert.equal(gh.calls.filter((c) => c === 'POST /git/commits').length, 2);
  const paths = [...gh.headTree().keys()];
  assert.ok(paths.includes('other.html'), 'the concurrent push survives');
  assert.ok(paths.includes('lp-data-backups/README.md'));
  assert.ok(paths.includes('deck.html'));
  assert.match(gh.read('lp-data-backups/records/company/co-1.json'), /"order": 3/);
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
  assert.ok(tree.has('lp-data-backups/records/INDEX.md'));
});

test('upload() refuses a buffer over the limit', async () => {
  const gh = fakeGitHub();
  const client = githubClient({ token: 'fake-token', repo: 'owner/private-docs', fetchImpl: gh.handle });
  await assert.rejects(client.upload('files/x.pdf', Buffer.alloc(MAX_BLOB_BYTES + 1)), /up to 95 MB/);
  assert.equal(gh.calls.filter((c) => c === 'POST /git/blobs').length, 0);
});

test('verification failure: a changed path missing from the committed tree fails the run', async () => {
  const { gh, run } = setup();
  gh.state.dropOnRead = 'files/archive/file-b-pdf';
  await assert.rejects(run(), /Verification of the commit failed: files\/archive\/file-b-pdf missing/);
  const r = setup();
  r.gh.state.dropOnRead = 'records/company/co-1.json';
  await assert.rejects(r.run(), /Verification of the commit failed: records\/company\/co-1\.json missing/);
});

test('time box: files past the per-run cap are pending and picked up next run', async () => {
  const { run } = setup();
  const r1 = await run({ maxFiles: 1 });
  assert.equal(r1.complete, false);
  assert.deepEqual(r1.files, { total: 3, kept: 0, copied: 1, pending: 2 });
  const r2 = await run();
  assert.equal(r2.complete, true);
  assert.match(r2.commit, /^[0-9a-f]{40}$/);
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

test('dated snapshot folders: never written; a leftover one is neither touched nor verified', async () => {
  const { gh, run } = setup({ files: { 'deck.html': 'deck', 'lp-data-backups/2026-01-01T00-00/sanity_docs.jsonl': '{}\n' } });
  gh.state.dropOnRead = '2026-01-01T00-00/sanity_docs.jsonl'; // verification must not look at it
  const r = await run();
  assert.equal(r.verified, true);
  assert.ok(!gh.changedIn(r.commit).some((p) => /\d{4}-\d{2}-\d{2}T/.test(p)));
  assert.equal(gh.read('lp-data-backups/2026-01-01T00-00/sanity_docs.jsonl'), '{}\n');
  const readme = gh.read('lp-data-backups/README.md');
  assert.match(readme, /\[redacted\]/);
  assert.match(readme, /x-upsert: true/);
  assert.match(readme, /pg_get_serial_sequence\('public\.sync_runs','id'\)/);
});
