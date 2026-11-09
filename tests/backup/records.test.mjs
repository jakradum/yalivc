// Per-record history: diffing, deletion, INDEX.md, and the Coordinator's edit
// tool (lp-edit), against the mocked GitHub + Supabase in fakes.mjs. Fake data only.
// Run: node --test tests/backup/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DOCS, ENV, docRow, setup } from './fakes.mjs';

const { runBackup } = await import('../../src/lib/backup/run.js');
const { runEdit, changedKeys, EDIT_TRAILER } = await import('../../src/lib/backup/edit.js');
const { indexMarkdown, recordLabel, stableJson, buildRecordFiles, recordPath, redact } = await import('../../src/lib/backup/records.js');
const { gitBlobSha } = await import('../../src/lib/backup/github.js');

const R = 'lp-data-backups/records';
const quiet = { log() {} };
const backup = (s, extra = {}) => runBackup({ target: 'github', env: ENV, fetchImpl: s.fetchImpl, ...extra });
const edit = (s, extra) => runEdit({ env: ENV, fetchImpl: s.fetchImpl, log: quiet, now: () => Date.parse('2026-11-09T10:00:00Z'), ...extra });
const docOf = (s, id) => s.supa.tables.sanity_docs.find((r) => r.id === id);

test('stableJson: keys sorted recursively, arrays keep order, 2-space indent, trailing newline', () => {
  assert.equal(stableJson({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: null } }),
    '{\n  "a": {\n    "c": null,\n    "d": [\n      3,\n      {\n        "y": 2,\n        "z": 1\n      }\n    ]\n  },\n  "b": 1\n}\n');
  assert.equal(stableJson({ b: 1, a: 2 }), stableJson({ a: 2, b: 1 }));
});

test('record paths refuse unsafe ids and types', () => {
  assert.equal(recordPath('company', 'abc-1_X'), 'company/abc-1_X.json');
  for (const bad of ['../x', 'a/b', '', '.hidden']) assert.throws(() => recordPath('company', bad), /unsafe id/);
  assert.throws(() => buildRecordFiles({ sanity_docs: [{ id: 'a', type: 'company', doc: { _id: 'b', _type: 'company' } }] }), /do not match/);
});

test('per-record diffing: a changed doc commits only its own file, inline (no blob calls)', async () => {
  const s = setup();
  await backup(s);
  s.gh.calls.length = 0;
  docOf(s, 'co-1').doc.order = 5;
  const r = await backup(s);
  assert.equal(r.changed, 1);
  assert.deepEqual(r.records, { added: 0, changed: 1, removed: 0, byType: { company: 1 } });
  assert.deepEqual(s.gh.changedIn(r.commit), [`${R}/company/co-1.json`]);
  assert.equal(s.gh.calls.filter((c) => c === 'POST /git/blobs').length, 0);
  assert.equal(s.gh.calls.filter((c) => c === 'POST /git/trees').length, 1);
  const entries = s.gh.treeBodies.at(-1).tree;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].path, `${R}/company/co-1.json`);
  assert.equal(typeof entries[0].content, 'string');
  assert.equal(s.gh.commits.get(r.commit).message, 'portal changes: 1 record (company 1)\n\nadded 0, changed 1, removed 0');
});

test('deletion: a removed row removes its file (and its INDEX line); an added row adds one', async () => {
  const s = setup();
  await backup(s);
  s.supa.tables.sanity_docs = s.supa.tables.sanity_docs.filter((r) => r.id !== 'co-1');
  s.supa.tables.sanity_docs.push(docRow({ _id: 'consent-1', _type: 'lpDownloadConsent', email: 'x@example.test', downloadType: 'report', reportQuarter: 'Q1', consentedAt: '2026-11-08T10:00:00Z' }));
  const r = await backup(s);
  assert.deepEqual(r.records, { added: 1, changed: 0, removed: 1, byType: { company: 1, lpDownloadConsent: 1 } });
  assert.deepEqual(s.gh.changedIn(r.commit), [`-${R}/company/co-1.json`, `${R}/INDEX.md`, `${R}/lpDownloadConsent/consent-1.json`]);
  assert.match(s.gh.commits.get(r.commit).message, /^portal changes: 2 records \(company 1, lpDownloadConsent 1\)\n\nadded 1, changed 0, removed 1$/);
  const index = s.gh.read(`${R}/INDEX.md`);
  assert.ok(!index.includes('co-1'));
  assert.match(index, /\| lpDownloadConsent \| consent-1 \| \[lpDownloadConsent\/consent-1\.json\]/);
  assert.equal(r.verified, true);
});

test('a missing table is not deleted from the repo; other files outside records/ untouched', async () => {
  const s = setup();
  await backup(s);
  delete s.supa.tables.parity_diffs; // e.g. a later migration not applied
  const r = await backup(s);
  assert.equal(r.commit, null);
  assert.ok(s.gh.headTree().has(`${R}/_tables/parity_diffs.json`));
});

test('INDEX.md: names for humans, never an email', async () => {
  const docs = [
    { _id: 'user-1', _type: 'portalUser', email: 'lp@example.test', name: 'Some LP' },
    { _id: 'sub-1', _type: 'newsletterSubscriber', email: 'reader@example.test' },
    { _id: 'co-1', _type: 'company', name: 'Acme Widgets' },
    { _id: 'inv-1', _type: 'lpInvestment', company: { _ref: 'co-1', _type: 'reference' } },
    { _id: 'upd-1', _type: 'lpCompanyQuarterUpdate', investment: { _ref: 'inv-1', _type: 'reference' }, quarter: 'Q2', fiscalYear: 'FY27' },
    { _id: 'cs-1', _type: 'contactSubmission', name: 'mail@example.test', email: 'mail@example.test' },
    { _id: 'rep-1', _type: 'lpQuarterlyReport', title: 'Q2 | report\nline two' },
    { _id: 'cs-2', _type: 'contactSubmission', name: 'Jane Person' },
    { _id: 'inv-2', _type: 'pitchSchedulerInvitation', founderName: 'Joe Founder', companyName: 'Startup Co' },
    { _id: 'fb-1', _type: 'lpPortalFeedback', name: 'Some Name' },
    { _id: 'tr-1', _type: 'travelRequest', title: 'Trip of Some Name' },
  ];
  const index = indexMarkdown(docs);
  assert.ok(!index.includes('@'), 'no email anywhere in INDEX.md');
  assert.match(index, /\| portalUser \| user-1 \| \[portalUser\/user-1\.json\]\(portalUser\/user-1\.json\) \|/);
  assert.match(index, /\| newsletterSubscriber \| sub-1 \|/);
  assert.match(index, /\| lpInvestment \| Acme Widgets \|/);
  assert.match(index, /\| lpCompanyQuarterUpdate \| Acme Widgets Q2 FY27 \|/);
  assert.match(index, /\| contactSubmission \| cs-1 \|/);
  for (const id of ['cs-2', 'inv-2', 'fb-1', 'tr-1']) assert.match(index, new RegExp(`\\| ${id} \\|`));
  for (const name of ['Jane Person', 'Joe Founder', 'Startup Co', 'Some Name']) assert.ok(!index.includes(name), `${name} not in INDEX`);
  assert.match(index, /\| lpQuarterlyReport \| Q2 report line two \|/);
  assert.equal(recordLabel({ _id: 'x', _type: 'company' }), 'x');
});

test('lp-edit: drift is committed first as portal changes, then the edit as its own commit; both sides read back', async () => {
  const s = setup();
  await backup(s);
  // the portal writes a log record after the last backup (drift)
  s.supa.tables.sanity_docs.push(docRow({ _id: 'consent-1', _type: 'lpDownloadConsent', email: 'x@example.test', downloadType: 'report', consentedAt: '2026-11-08T10:00:00Z' }));
  const head0 = s.gh.state.ref;
  const r = await edit(s, {
    message: 'Fix the company name and order',
    rev: () => 'newrev1',
    edit: async (api) => {
      const [co] = await api.getDocs({ type: 'company', id: 'co-1' });
      co.name = 'Acme Widgets Ltd';
      co.order = 7;
      const all = await api.getDocs('portalUser');
      assert.equal(all.length, 1);
      return [co];
    },
  });
  assert.equal(r.verified, true);
  assert.deepEqual(r.edits, [{ path: `records/company/co-1.json`, action: 'changed', keys: ['name', 'order'] }]);

  const drift = s.gh.commits.get(r.drift.commit);
  assert.deepEqual(drift.parents, [head0]);
  assert.match(drift.message, /^portal changes: 1 record \(lpDownloadConsent 1\)/);
  assert.deepEqual(s.gh.changedIn(r.drift.commit), [`${R}/INDEX.md`, `${R}/lpDownloadConsent/consent-1.json`]);

  const ed = s.gh.commits.get(r.commit);
  assert.deepEqual(ed.parents, [r.drift.commit]);
  assert.equal(ed.message, `Fix the company name and order\n\n${EDIT_TRAILER}`);
  assert.deepEqual(s.gh.changedIn(r.commit), [`${R}/INDEX.md`, `${R}/company/co-1.json`]); // INDEX: the name changed

  // Supabase: CAS patch with the new rev and _updatedAt
  const row = docOf(s, 'co-1');
  assert.equal(row.rev, 'newrev1');
  assert.equal(row.sanity_updated_at, '2026-11-09T10:00:00.000Z');
  assert.equal(row.doc._rev, 'newrev1');
  assert.equal(row.doc._updatedAt, '2026-11-09T10:00:00.000Z');
  assert.equal(row.doc.name, 'Acme Widgets Ltd');
  const patch = s.supa.writes.find((w) => w.method === 'PATCH');
  assert.match(patch.query, /id=eq\.co-1&rev=eq\.r1/);
  // GitHub holds exactly the Supabase doc
  assert.equal(s.gh.read(`${R}/company/co-1.json`), stableJson(row.doc));

  // a backup right after finds nothing to commit
  const after = await backup(s);
  assert.equal(after.commit, null);
});

test('lp-edit: no drift → only the edit commit; deletion and a new doc', async () => {
  const s = setup();
  await backup(s);
  const head0 = s.gh.state.ref;
  const r = await edit(s, {
    message: 'Remove the old company; add its replacement',
    edit: async () => ({ changed: [{ _id: 'co-2', _type: 'company', name: 'New Co' }], deleted: ['co-1'] }),
  });
  assert.equal(r.drift.commit, null);
  assert.deepEqual(s.gh.commits.get(r.commit).parents, [head0]);
  assert.deepEqual(s.gh.changedIn(r.commit), [`-${R}/company/co-1.json`, `${R}/INDEX.md`, `${R}/company/co-2.json`]);
  assert.equal(docOf(s, 'co-1'), undefined);
  assert.equal(docOf(s, 'co-2').doc._createdAt, '2026-11-09T10:00:00.000Z');
});

test('lp-edit --dry-run: prints paths and keys, writes nothing to Supabase or GitHub (drift included)', async () => {
  const s = setup();
  await backup(s);
  s.supa.tables.sanity_docs.push(docRow({ _id: 'consent-1', _type: 'lpDownloadConsent', downloadType: 'report' }));
  const head0 = s.gh.state.ref;
  const lines = [];
  s.gh.calls.length = 0;
  const r = await edit(s, {
    dryRun: true,
    log: { log: (l) => lines.push(l) },
    message: 'Try a change',
    edit: async (api) => {
      const co = await api.getDoc('co-1');
      co.slug.current = 'acme-2';
      return [co];
    },
  });
  assert.equal(r.dryRun, true);
  assert.deepEqual(r.edits, [{ path: 'records/company/co-1.json', action: 'changed', keys: ['slug.current'] }]);
  assert.equal(s.gh.state.ref, head0);
  assert.deepEqual(s.gh.calls.filter((c) => !c.startsWith('GET')), []);
  assert.deepEqual(s.supa.writes, []);
  assert.equal(docOf(s, 'co-1').doc.slug.current, 'acme');
  const out = lines.join('\n');
  assert.match(out, /would commit portal changes first: 1 records/);
  assert.match(out, /changed records\/company\/co-1\.json\n\s+keys: slug\.current/);
  assert.ok(!out.includes('acme-2'), 'values are never printed');
});

test('lp-edit: a record changed in Supabase after the read → nothing saved, nothing committed', async () => {
  const s = setup();
  await backup(s);
  const head0 = s.gh.state.ref;
  await assert.rejects(edit(s, {
    message: 'Change order',
    edit: async (api) => {
      const co = await api.getDoc('co-1');
      co.order = 9;
      docOf(s, 'co-1').rev = 'someone-else'; // a portal write lands meanwhile
      return [co];
    },
  }), /changed in Supabase since it was read; nothing was saved/);
  assert.deepEqual(s.supa.writes, []);
  assert.equal(s.gh.state.ref, head0);
});

test('lp-edit: refuses an email in the message, a _type change, and unchanged docs make no commit', async () => {
  const s = setup();
  await backup(s);
  await assert.rejects(edit(s, { message: 'Per a@b.example', edit: async () => [] }), /must not contain an email/);
  await assert.rejects(edit(s, { message: 'x', edit: async (api) => [{ ...(await api.getDoc('co-1')), _type: 'investor' }] }), /_type cannot change/);
  const head0 = s.gh.state.ref;
  const r = await edit(s, { message: 'No-op', edit: async (api) => [await api.getDoc('co-1')] });
  assert.equal(r.commit, null);
  assert.equal(s.gh.state.ref, head0);
  assert.deepEqual(s.supa.writes, []);
});

test('credentials are redacted in record files and tables, at any depth, any case; cron and lp-edit agree', async () => {
  const auth = { _id: 'auth-1', _type: 'pitchSchedulerCalendarAuth', refreshToken: 'fake-refresh', connectedBy: 'team', nested: [{ API_KEY: 'k', accessToken: null, clientSecret: 's', Password: 'p', note: 'keep' }] };
  const s = setup({ docs: [...DEFAULT_DOCS, auth] });
  await backup(s);
  const file = s.gh.read(`${R}/pitchSchedulerCalendarAuth/auth-1.json`);
  for (const v of ['fake-refresh', '"k"', '"s"', '"p"']) assert.ok(!file.includes(v), `${v} redacted`);
  assert.equal(JSON.parse(file).refreshToken, '[redacted]');
  assert.deepEqual(JSON.parse(file).nested, [{ API_KEY: '[redacted]', Password: '[redacted]', accessToken: null, clientSecret: '[redacted]', note: 'keep' }]);
  assert.equal(redact({ token: 'x', tokenized: 'y', plain: 'z' }).plain, 'z');

  // lp-edit on that doc: Supabase keeps the real value, GitHub the redacted one, read-back passes
  const r = await edit(s, { message: 'Note who connected', edit: async (api) => { const d = await api.getDoc('auth-1'); d.connectedBy = 'ops'; return [d]; } });
  assert.equal(r.verified, true);
  assert.equal(docOf(s, 'auth-1').doc.refreshToken, 'fake-refresh');
  assert.equal(JSON.parse(s.gh.read(`${R}/pitchSchedulerCalendarAuth/auth-1.json`)).refreshToken, '[redacted]');
  assert.equal((await backup(s)).commit, null, 'the cron sees no difference afterwards');
});

test('changedKeys lists dotted paths and array indexes', () => {
  assert.deepEqual(changedKeys({ a: 1, b: { c: [1, 2] }, d: 1 }, { a: 1, b: { c: [1, 3] }, e: 2 }), ['b.c[1]', 'd', 'e']);
});

test('many records: tree requests are chunked, still one commit, every blob verified', async () => {
  const docs = Array.from({ length: 450 }, (_, i) => ({ _id: `co-${i}`, _type: 'company', name: `Company ${i}` }));
  const s = setup({ docs });
  const r = await backup(s);
  assert.equal(r.records.added, 450);
  assert.equal(s.gh.calls.filter((c) => c === 'POST /git/commits').length, 1);
  assert.ok(s.gh.calls.filter((c) => c === 'POST /git/trees').length >= 2);
  const tree = s.gh.headTree();
  assert.equal(tree.get(`${R}/company/co-7.json`).sha, gitBlobSha(Buffer.from(stableJson(docs[7]), 'utf8')));
});
