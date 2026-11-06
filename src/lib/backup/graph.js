// Microsoft Graph side of the OneDrive backup: where backups go, the delegated
// token (stored in Supabase `ms_graph_tokens`, purpose 'onedrive-backup'), and
// the few drive calls the job needs. Uses the same Azure app as the pitch
// scheduler calendar (MS_GRAPH_*), but its own consent and its own refresh
// token, kept out of Sanity.
//
// Target (BACKUP_ONEDRIVE_TARGET):
//   'appfolder' (default): least privilege. Files.ReadWrite.AppFolder only
//     reaches the app's own folder, Apps/<Azure app name>/ in the consenting
//     user's OneDrive; backups go in "Yali LP Data Backups" inside it.
//   'folder': fallback if the AppFolder scope can't be consented in the tenant.
//     Files.ReadWrite (already consented for the deck uploads) and an existing
//     folder given by BACKUP_ONEDRIVE_DRIVE_ID + BACKUP_ONEDRIVE_FOLDER_ID.
//
// Tokens are never logged or put in error messages; only Microsoft's error codes are.

export const PURPOSE = 'onedrive-backup';
export const BACKUP_OWNER = 'pranav@yali.vc';
export const BACKUP_FOLDER_NAME = 'Yali LP Data Backups';
// The only redirect URI known to be registered on the Azure app. The calendar
// callback hands requests with a backup `state` to handleBackupCallback().
export const REDIRECT_URI = 'https://yali.vc/api/pitch-scheduler-calendar-callback';
export const SIMPLE_UPLOAD_MAX = 4 * 1024 * 1024;
export const CHUNK = 320 * 1024 * 16; // 5 MiB, a multiple of 320 KiB as Graph requires

const GRAPH = 'https://graph.microsoft.com/v1.0';
const G = 'https://graph.microsoft.com/';

export class NotConnectedError extends Error {}
export class NotConfiguredError extends Error {}

export function backupTarget(env = process.env) {
  const mode = (env.BACKUP_ONEDRIVE_TARGET || 'appfolder').toLowerCase();
  if (mode === 'folder') {
    const driveId = env.BACKUP_ONEDRIVE_DRIVE_ID;
    const folderId = env.BACKUP_ONEDRIVE_FOLDER_ID;
    if (!driveId || !folderId) throw new NotConfiguredError('BACKUP_ONEDRIVE_TARGET=folder needs BACKUP_ONEDRIVE_DRIVE_ID and BACKUP_ONEDRIVE_FOLDER_ID');
    return {
      mode,
      base: `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}`,
      rootRel: '', // the configured folder is the backup root
      scope: `offline_access ${G}Files.ReadWrite`,
      connectScope: `offline_access ${G}User.Read ${G}Files.ReadWrite`,
      label: 'the configured OneDrive folder',
    };
  }
  return {
    mode: 'appfolder',
    base: '/me/drive/special/approot',
    rootRel: BACKUP_FOLDER_NAME,
    scope: `offline_access ${G}Files.ReadWrite.AppFolder`,
    // User.Read only so the callback can check which account consented.
    connectScope: `offline_access ${G}User.Read ${G}Files.ReadWrite.AppFolder`,
    label: `Apps/<app name>/${BACKUP_FOLDER_NAME}`,
  };
}

export function graphConfig(env = process.env) {
  const tenant = env.MS_GRAPH_TENANT_ID, clientId = env.MS_GRAPH_CLIENT_ID, secret = env.MS_GRAPH_CLIENT_SECRET;
  if (!tenant || !clientId || !secret) throw new NotConfiguredError('MS_GRAPH_TENANT_ID / MS_GRAPH_CLIENT_ID / MS_GRAPH_CLIENT_SECRET are not set');
  return { tenant, clientId, secret, tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token` };
}

// ── token store (Supabase PostgREST with the secret key) ─────────────────────
export function supabaseTokenStore({ url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY, fetchImpl = fetch } = {}) {
  if (!url || !key) throw new NotConfiguredError('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const rowUrl = `${url}/rest/v1/ms_graph_tokens?purpose=eq.${PURPOSE}`;
  return {
    async get() {
      const res = await fetchImpl(`${rowUrl}&select=refresh_token,scope`, { headers });
      if (res.status === 404) throw new NotConnectedError('OneDrive backup is not connected: the ms_graph_tokens table does not exist (apply migration 0003)');
      if (!res.ok) throw new Error(`Supabase read ms_graph_tokens failed: ${res.status}`);
      const [row] = await res.json();
      return row || null;
    },
    async save(refreshToken, scope) {
      const res = await fetchImpl(`${url}/rest/v1/ms_graph_tokens?on_conflict=purpose`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ purpose: PURPOSE, refresh_token: refreshToken, scope, updated_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`Supabase write ms_graph_tokens failed: ${res.status}`);
    },
    async rotate(refreshToken) {
      const res = await fetchImpl(rowUrl, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ refresh_token: refreshToken, updated_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`Supabase update ms_graph_tokens failed: ${res.status}`);
    },
  };
}

// Refreshes the delegated token. Persists a rotated refresh token before returning.
export async function getBackupAccessToken({ store, target, config, fetchImpl = fetch }) {
  const row = await store.get();
  if (!row?.refresh_token) throw new NotConnectedError('OneDrive backup is not connected yet. Pranav: sign in at team.yali.vc, then open https://team.yali.vc/api/backup-connect');
  const res = await fetchImpl(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.secret,
      grant_type: 'refresh_token',
      refresh_token: row.refresh_token,
      scope: target.scope,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Microsoft token refresh failed (${res.status} ${data.error || 'no access token'}). Reconnect at https://team.yali.vc/api/backup-connect`);
  }
  if (data.refresh_token && data.refresh_token !== row.refresh_token) await store.rotate(data.refresh_token);
  return data.access_token;
}

// ── drive client ─────────────────────────────────────────────────────────────
const encPath = (rel) => rel.split('/').filter(Boolean).map(encodeURIComponent).join('/');

export function driveClient({ token, target, fetchImpl = fetch }) {
  const addr = (rel) => (rel ? `${target.base}:/${encPath(rel)}:` : target.base);
  const join = (...parts) => parts.filter(Boolean).join('/');
  const root = (rel = '') => join(target.rootRel, rel);

  async function call(method, path, { body, headers = {}, what, ok = [] } = {}) {
    const url = path.startsWith('https://') ? path : `${GRAPH}${path}`;
    const res = await fetchImpl(url, { method, headers: { Authorization: `Bearer ${token}`, ...headers }, body });
    if (res.ok || ok.includes(res.status)) return res;
    const err = await res.json().catch(() => ({}));
    throw new Error(`Graph ${what || method} failed: ${res.status} ${err?.error?.code || ''}`.trim());
  }

  // Creates each missing folder along rel (relative to the backup root).
  async function ensureFolder(rel) {
    const parts = root(rel).split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      const parent = parts.slice(0, i).join('/');
      await call('POST', `${addr(parent)}/children`, {
        what: `create folder ${parts.slice(0, i + 1).join('/')}`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: parts[i], folder: {}, '@microsoft.graph.conflictBehavior': 'fail' }),
        ok: [409], // already exists
      });
    }
  }

  // → Map(name → size) of the folder's children; empty if the folder doesn't exist.
  async function listChildren(rel) {
    const out = new Map();
    let next = `${addr(root(rel))}/children?$select=name,size,file,folder&$top=999`;
    while (next) {
      const res = await call('GET', next, { what: `list ${rel || 'root'}`, ok: [404] });
      if (res.status === 404) return out;
      const data = await res.json();
      for (const item of data.value || []) out.set(item.name, item.size);
      next = data['@odata.nextLink'] || null;
    }
    return out;
  }

  // Uploads (replacing) a file at rel under the backup root. → the driveItem's size.
  async function upload(rel, buf) {
    const path = root(rel);
    if (buf.length <= SIMPLE_UPLOAD_MAX) {
      const res = await call('PUT', `${addr(path)}/content`, {
        what: `upload ${rel}`,
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      return (await res.json()).size;
    }
    const session = await call('POST', `${addr(path)}/createUploadSession`, {
      what: `upload session ${rel}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'replace' } }),
    }).then((r) => r.json());
    const uploadUrl = session.uploadUrl;
    try {
      for (let start = 0; start < buf.length; start += CHUNK) {
        const end = Math.min(start + CHUNK, buf.length) - 1;
        // The upload URL is pre-authenticated: no Authorization header.
        const res = await fetchImpl(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${buf.length}` },
          body: buf.subarray(start, end + 1),
        });
        if (!res.ok) throw new Error(`Graph upload chunk ${rel} failed: ${res.status}`);
        if (end === buf.length - 1) return (await res.json()).size;
      }
    } catch (err) {
      await fetchImpl(uploadUrl, { method: 'DELETE' }).catch(() => {});
      throw err;
    }
    throw new Error(`Graph upload ${rel} ended without a final response`);
  }

  async function me() {
    const res = await call('GET', '/me?$select=userPrincipalName', { what: 'read signed-in user' });
    return String((await res.json()).userPrincipalName || '').toLowerCase();
  }

  async function rootInfo() {
    await ensureFolder('');
    const res = await call('GET', `${addr(root())}?$select=name,webUrl`, { what: 'read backup folder' });
    return res.json();
  }

  return { ensureFolder, listChildren, upload, me, rootInfo };
}
