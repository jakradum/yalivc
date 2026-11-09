// GitHub side of the LP data backup: a drive client for runBackup()
// (src/lib/backup/run.js) that writes into Pranav's PRIVATE repo
// (GITHUB_BACKUP_REPO, default jakradum/yali-docs) under lp-data-backups/,
// through the REST Git Data API. Nothing outside lp-data-backups/ is touched:
// the new tree is built on the branch's current tree, with entries only under
// that folder.
//
// Same interface as the OneDrive client in graph.js (listTree, upload), plus
// commit(): uploads only create blobs and stage them; commit() makes ONE tree +
// ONE commit for the whole run and moves refs/heads/<branch> without force. If
// the branch moved meanwhile (non-fast-forward), it rebuilds on the new head and
// retries once. listTree() reads the tree back from GitHub, before the commit
// (what is already backed up) and after it (verification).
//
// GITHUB_BACKUP_TOKEN: fine-grained PAT, Contents read/write on that one repo.
// Never logged or put in error messages; only GitHub's status and message are.
import { createHash } from 'node:crypto';
import { NotConfiguredError } from './graph.js';

export const DEFAULT_REPO = 'jakradum/yali-docs';
export const DEFAULT_BRANCH = 'main';
export const BACKUP_ROOT = 'lp-data-backups';
// GitHub rejects files over 100 MB; stay clear of it.
export const MAX_BLOB_BYTES = 95 * 1024 * 1024;
const API = 'https://api.github.com';

// Git's object id for file content: SHA-1 of "blob <size>\0<content>".
export function gitBlobSha(buf) {
  return createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
}

export function githubConfig(env = process.env) {
  const token = env.GITHUB_BACKUP_TOKEN;
  if (!token) throw new NotConfiguredError('GITHUB_BACKUP_TOKEN is not set');
  const repo = env.GITHUB_BACKUP_REPO || DEFAULT_REPO;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new NotConfiguredError('GITHUB_BACKUP_REPO must look like owner/name');
  return { token, repo, branch: env.GITHUB_BACKUP_BRANCH || DEFAULT_BRANCH };
}

export class RefRaceError extends Error {}

export function githubClient({ token, repo, branch = DEFAULT_BRANCH, root = BACKUP_ROOT, fetchImpl = fetch }) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'yali-lp-backup',
  };

  async function call(method, path, { body, what, ok = [] } = {}) {
    const res = await fetchImpl(`${API}/repos/${repo}${path}`, {
      method,
      headers: body ? { ...headers, 'Content-Type': 'application/json' } : headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok || ok.includes(res.status)) return res;
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub ${what || `${method} ${path}`} failed: ${res.status} ${String(err?.message || '').slice(0, 200)}`.trim());
  }
  const json = async (...a) => (await call(...a)).json();

  let base = null; // { commit, tree } the run builds on (after commit: the run's own commit)
  let listing = null; // Map(rel → { size, sha }) of every blob under root/ in base.tree
  const staged = new Map(); // rel → { sha, size }

  async function readHead() {
    const ref = await json('GET', `/git/ref/heads/${encodeURIComponent(branch)}`, { what: `read branch ${branch}` });
    const commit = ref.object.sha;
    const c = await json('GET', `/git/commits/${commit}`, { what: 'read head commit' });
    return { commit, tree: c.tree.sha };
  }

  // Every blob under root/ in a tree → Map(rel → { size, sha }).
  async function readTree(treeSha) {
    const out = new Map();
    const top = await json('GET', `/git/trees/${treeSha}`, { what: 'read root tree' });
    if (top.truncated) throw new Error('GitHub root tree listing was truncated');
    const sub = (top.tree || []).find((e) => e.path === root && e.type === 'tree');
    if (!sub) return out;
    const t = await json('GET', `/git/trees/${sub.sha}?recursive=1`, { what: `read ${root}/ tree` });
    if (t.truncated) throw new Error(`GitHub listing of ${root}/ was truncated; verification impossible`);
    for (const e of t.tree || []) if (e.type === 'blob') out.set(e.path, { size: e.size, sha: e.sha });
    return out;
  }

  async function current() {
    if (!base) base = await readHead();
    if (!listing) listing = await readTree(base.tree);
    return listing;
  }

  // → Map(path relative to rel → { size, sha }); only direct children unless recursive.
  async function listTree(rel = '', { recursive = true } = {}) {
    const all = await current();
    const prefix = rel ? `${rel.replace(/\/+$/, '')}/` : '';
    const out = new Map();
    for (const [p, v] of all) {
      if (!p.startsWith(prefix)) continue;
      const r = p.slice(prefix.length);
      if (recursive || !r.includes('/')) out.set(r, v);
    }
    return out;
  }

  // Stages rel (under root/) for the run's commit. A path already holding the
  // same content is left alone (no blob, no tree entry). → bytes.
  async function upload(rel, buf) {
    if (buf.length > MAX_BLOB_BYTES) {
      throw new Error(`${rel} is ${(buf.length / 1048576).toFixed(1)} MB; GitHub backups take files up to ${MAX_BLOB_BYTES / 1048576} MB`);
    }
    const sha = gitBlobSha(buf);
    if ((await current()).get(rel)?.sha === sha) return buf.length;
    const blob = await json('POST', '/git/blobs', { what: `create blob for ${rel}`, body: { content: buf.toString('base64'), encoding: 'base64' } });
    if (blob.sha !== sha) throw new Error(`GitHub blob for ${rel} has sha ${blob.sha}, expected ${sha}`);
    staged.set(rel, { sha, size: buf.length });
    return buf.length;
  }

  async function attempt(on, message, entries) {
    const tree = await json('POST', '/git/trees', { what: 'create tree', body: { base_tree: on.tree, tree: entries } });
    const commit = await json('POST', '/git/commits', { what: 'create commit', body: { message, tree: tree.sha, parents: [on.commit] } });
    const res = await call('PATCH', `/git/refs/heads/${encodeURIComponent(branch)}`, {
      what: `update branch ${branch}`,
      body: { sha: commit.sha, force: false },
      ok: [409, 422], // not a fast-forward: the branch moved since we read it
    });
    if (!res.ok) throw new RefRaceError(`branch ${branch} moved during the backup (${res.status})`);
    return { commit: commit.sha, tree: tree.sha };
  }

  // One commit with everything staged. → { sha, files } (sha null when nothing changed).
  async function commit(message) {
    if (!staged.size) return { sha: null, files: 0 };
    await current();
    const entries = [...staged].map(([rel, { sha }]) => ({ path: `${root}/${rel}`, mode: '100644', type: 'blob', sha }));
    let made;
    try {
      made = await attempt(base, message, entries);
    } catch (err) {
      if (!(err instanceof RefRaceError)) throw err;
      made = await attempt(await readHead(), message, entries); // second race: throws
    }
    const files = staged.size;
    staged.clear();
    base = made;
    listing = null; // next listTree reads the committed tree back from GitHub
    return { sha: made.commit, files };
  }

  return { kind: 'github', maxBytes: MAX_BLOB_BYTES, listTree, upload, commit, staged };
}
