// Fake Supabase (PostgREST tables + storage) and fake GitHub (Git Data API, one
// repo, branch main) for the backup tests. Fake data only.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gitBlobSha } from '../../src/lib/backup/github.js';

export const SUPA = 'https://supabase.test';
export const ENV = { SUPABASE_URL: SUPA, SUPABASE_SECRET_KEY: 'fake-key', GITHUB_BACKUP_TOKEN: 'fake-token', GITHUB_BACKUP_REPO: 'owner/private-docs' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const sha1 = (b) => createHash('sha1').update(b).digest('hex');

export const docRow = (doc) => ({ id: doc._id, type: doc._type, rev: doc._rev ?? 'r0', sanity_updated_at: doc._updatedAt ?? '2026-01-01T00:00:00Z', doc, synced_at: '2026-01-01T00:00:00Z' });

export const DEFAULT_DOCS = [
  { _id: 'user-1', _type: 'portalUser', _rev: 'r1', email: 'someone@example.test', isActive: true },
  { _id: 'co-1', _type: 'company', _rev: 'r1', name: 'Acme Widgets', order: 2, slug: { current: 'acme', _type: 'slug' } },
];

// ── fake Supabase ────────────────────────────────────────────────────────────
export function fakeSupabase({ objects, docs = DEFAULT_DOCS }) {
  // objects: { 'path/in/bucket': Buffer | { size } } ({ size } = listed but never downloadable)
  const downloads = [];
  const writes = [];
  const fileRows = Object.entries(objects)
    .filter(([p, b]) => Buffer.isBuffer(b) && !p.startsWith('archive/originals/'))
    .map(([p, b], i) => ({ asset_id: `file-${i}`, storage_path: p, sha1: sha1(b), size_bytes: b.length }));
  const tables = {
    sanity_docs: docs.map((d) => docRow(structuredClone(d))),
    sanity_files: fileRows,
    sync_runs: [],
    sync_types: [{ type: 'portalUser', enabled: false }],
    parity_diffs: [],
  };
  const hooks = { beforeWrite: null };

  // Minimal PostgREST filters: col=eq.x, col=is.null, col=in.("a","b")
  function filtersOf(u) {
    const out = [];
    for (const [k, v] of u.searchParams) {
      if (['select', 'order', 'on_conflict'].includes(k)) continue;
      if (v.startsWith('eq.')) out.push((r) => String(r[k]) === v.slice(3));
      else if (v === 'is.null') out.push((r) => r[k] == null);
      else if (v.startsWith('in.(')) {
        const set = new Set(v.slice(4, -1).split(',').map((s) => s.replace(/^"|"$/g, '')));
        out.push((r) => set.has(String(r[k])));
      }
    }
    return (r) => out.every((f) => f(r));
  }

  async function handle(url, opts = {}) {
    const u = new URL(url);
    const m = opts.method || 'GET';
    if (u.pathname.startsWith('/rest/v1/')) {
      const t = u.pathname.slice('/rest/v1/'.length);
      if (!tables[t]) return json({ code: 'PGRST205' }, 404);
      const match = filtersOf(u);
      if (m === 'GET') {
        const from = Number(String(opts.headers?.Range || '0-').split('-')[0]);
        return json(from === 0 ? structuredClone(tables[t].filter(match)) : []);
      }
      await hooks.beforeWrite?.({ method: m, table: t });
      const body = opts.body ? JSON.parse(opts.body) : null;
      writes.push({ method: m, table: t, query: u.search });
      if (m === 'PATCH') {
        const hit = tables[t].filter(match);
        for (const r of hit) Object.assign(r, structuredClone(body));
        return json(structuredClone(hit));
      }
      if (m === 'POST') {
        tables[t].push(structuredClone(body));
        return json([body], 201);
      }
      if (m === 'DELETE') {
        const hit = tables[t].filter(match);
        tables[t] = tables[t].filter((r) => !match(r));
        return json(hit);
      }
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
  return { handle, downloads, writes, tables, hooks };
}

// ── fake GitHub (one repo, branch main) ──────────────────────────────────────
export function fakeGitHub({ files = { 'deck.html': 'deck' } } = {}) {
  const blobs = new Map(); // sha → Buffer
  const trees = new Map(); // id → Map(path → { sha, size })
  const commits = new Map(); // sha → { tree, parents, message }
  const calls = [];
  const treeBodies = [];
  let n = 0;
  const state = { ref: null, raceOnce: 0, dropOnRead: null, onRace: null };
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
      treeBodies.push(body);
      const next = new Map(trees.get(body.base_tree));
      for (const e of body.tree) {
        if (e.sha === null) {
          if (!next.has(e.path)) return json({ message: 'GitHub: path to delete not in base tree' }, 422);
          next.delete(e.path);
        } else if (e.content !== undefined) {
          const s = putBlob(Buffer.from(e.content, 'utf8'));
          next.set(e.path, { sha: s, size: blobs.get(s).length });
        } else next.set(e.path, { sha: e.sha, size: blobs.get(e.sha).length });
      }
      return json({ sha: mkTree(next) }, 201);
    }
    if (m === 'POST' && p === '/git/commits') return json({ sha: mkCommit(body.tree, body.parents, body.message) }, 201);
    if (m === 'PATCH' && p === '/git/refs/heads/main') {
      assert.equal(body.force, false);
      if (state.raceOnce > 0) { state.raceOnce--; (state.onRace || (() => foreignPush(`other-${n}.html`)))(); }
      if (commits.get(body.sha).parents[0] !== state.ref) return json({ message: 'Update is not a fast forward' }, 422);
      state.ref = body.sha;
      return json({ object: { sha: body.sha } });
    }
    return json({ message: 'Not Found' }, 404);
  }
  const treeOf = (commit) => trees.get(commits.get(commit).tree);
  const headTree = () => treeOf(state.ref);
  const read = (path, commit = state.ref) => { const e = treeOf(commit).get(path); return e ? blobs.get(e.sha).toString('utf8') : undefined; };
  // Paths that differ between a commit and its first parent.
  function changedIn(commit) {
    const c = commits.get(commit);
    const a = treeOf(c.parents[0]);
    const b = trees.get(c.tree);
    const out = [];
    for (const [p, v] of b) if (a.get(p)?.sha !== v.sha) out.push(p);
    for (const p of a.keys()) if (!b.has(p)) out.push(`-${p}`);
    return out.sort();
  }
  return { handle, calls, state, commits, treeBodies, headTree, treeOf, read, changedIn, foreignPush };
}

export function setup({ objects, files, docs } = {}) {
  const supa = fakeSupabase({ objects: objects || { 'file-a-pdf': Buffer.from('%PDF a'), 'archive/file-b-pdf': Buffer.from('%PDF bb'), 'archive/originals/big.pdf': Buffer.from('%PDF original') }, docs });
  const gh = fakeGitHub({ files });
  const fetchImpl = (url, opts) => (String(url).startsWith(SUPA) ? supa.handle(url, opts) : gh.handle(url, opts));
  return { supa, gh, fetchImpl };
}
