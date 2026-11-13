import 'server-only';

// Yali Assets: deck PDFs in the private Supabase bucket `team-decks`, one folder
// per deck (`<deck>/<file>.pdf`), shown on team.yali.vc/assets to any Yali account.
// Nothing here is public: the page lists files with the secret key and every
// download goes through /assets/open/..., which re-checks the session and hands
// out a signed URL that lives for a minute. Upload new versions with
// scripts/upload-team-deck.mjs.
const BUCKET = 'team-decks';

// Folder → what the page calls it. A folder not listed here still shows, under its folder name.
export const TEAM_DECKS = {
  'theses-overview': { title: 'Investment Theses Overview', blurb: 'One page per sector: where we invest, the Indian companies and the global benchmark.' },
  'theses-deck': { title: 'Investment Theses', blurb: 'The full theses: every sector’s map and what wins, plus the Advanced Materials, Quantum and Space Tech deep dives.' },
};

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  return { url, key };
}

async function storage(path, body) {
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1${path}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase storage ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

// "Yali Investment Theses Deck v2.0.pdf" → [2, 0]; files without a version sort by date.
const versionOf = (name) => (name.match(/v(\d+)\.(\d+)/) || []).slice(1).map(Number);
const newer = (a, b) => {
  const [va, vb] = [versionOf(a.name), versionOf(b.name)];
  if (va.length && vb.length) return vb[0] - va[0] || vb[1] - va[1];
  return new Date(b.updated_at) - new Date(a.updated_at);
};

// → [{ key, title, blurb, latest: { path, name, version, size, updated }, earlier: [...] }]
export async function listTeamDecks() {
  const top = await storage(`/object/list/${BUCKET}`, { prefix: '', limit: 100 });
  const folders = top.filter((x) => !x.id).map((x) => x.name); // folders have no id
  const decks = await Promise.all(folders.map(async (folder) => {
    const files = (await storage(`/object/list/${BUCKET}`, { prefix: `${folder}/`, limit: 100 }))
      .filter((f) => f.id && f.name.toLowerCase().endsWith('.pdf'))
      .sort(newer)
      .map((f) => ({
        path: `${folder}/${f.name}`,
        name: f.name,
        version: versionOf(f.name).length ? `v${versionOf(f.name).join('.')}` : null,
        size: f.metadata?.size || 0,
        updated: f.updated_at,
      }));
    if (!files.length) return null;
    const meta = TEAM_DECKS[folder] || { title: folder, blurb: '' };
    return { key: folder, ...meta, latest: files[0], earlier: files.slice(1) };
  }));
  const order = Object.keys(TEAM_DECKS);
  const rank = (k) => (order.includes(k) ? order.indexOf(k) : order.length);
  return decks.filter(Boolean).sort((a, b) => rank(a.key) - rank(b.key) || a.title.localeCompare(b.title));
}

// A path from the page → a one-minute signed URL. Only `<folder>/<file>.pdf` inside the bucket.
export async function signTeamDeck(path) {
  if (!/^[a-z0-9-]+\/[^/]+\.pdf$/i.test(path) || path.includes('..')) return null;
  const { url } = config();
  const res = await storage(`/object/sign/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, { expiresIn: 60 });
  return res?.signedURL ? `${url}/storage/v1${res.signedURL}` : null;
}
