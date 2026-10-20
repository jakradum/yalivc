// Pitch decks uploaded through the scheduler land in Pranav's OneDrive under
// "Pitch Decks/<Company>/". The browser uploads straight to OneDrive via a
// Graph upload session (a pre-authenticated URL), so the file never passes
// through Vercel and its 4.5 MB request-body cap doesn't apply. Uses the same
// delegated grant as graphCalendar.js, with Files.ReadWrite added.
//
// The folder itself stays private to Pranav. Each deck gets an
// organization-scoped view link, which only signed-in Yali (tenant) accounts
// can open - that link is what goes into the calendar invite.

import { getGraphToken, FILES_SCOPE } from './graphCalendar';

export const DECK_ROOT = 'Pitch Decks';
export const MAX_DECK_BYTES = 25 * 1024 * 1024;

const GRAPH = 'https://graph.microsoft.com/v1.0';

// OneDrive rejects these in names; also strip control chars and leading dots.
function safeName(value, fallback) {
  const cleaned = String(value || '')
    .replace(/[\x00-\x1F\x7F"*:<>?/\\|#%]/g, '')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 100);
  return cleaned || fallback;
}

async function graphFetch(path, options = {}) {
  const token = await getGraphToken(FILES_SCOPE);
  if (!token) throw new Error('OneDrive not connected');
  const res = await fetch(`${GRAPH}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Graph ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Returns the pre-authenticated uploadUrl the browser PUTs the file to.
export async function createDeckUploadSession(companyName, fileName) {
  const folder = safeName(companyName, 'Unnamed');
  let name = safeName(fileName, 'deck.pdf');
  if (!/\.pdf$/i.test(name)) name = `${name}.pdf`;
  const itemPath = [DECK_ROOT, folder, name].map(encodeURIComponent).join('/');
  const data = await graphFetch(`/me/drive/root:/${itemPath}:/createUploadSession`, {
    method: 'POST',
    body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'rename' } }),
  });
  return data.uploadUrl;
}

// Verifies the uploaded item really is a PDF inside the deck folder (the item
// id comes back from the browser, so don't trust it blindly), then returns
// an org-only view link.
export async function shareUploadedDeck(itemId) {
  if (typeof itemId !== 'string' || !/^[A-Za-z0-9!._-]{1,200}$/.test(itemId)) throw new Error('Bad item id');
  const item = await graphFetch(`/me/drive/items/${encodeURIComponent(itemId)}?$select=id,name,size,file,parentReference,webUrl`);
  const parentPath = decodeURIComponent(item.parentReference?.path || '');
  if (!parentPath.includes(`/root:/${DECK_ROOT}/`)) throw new Error('Item is not in the deck folder');
  if (!/\.pdf$/i.test(item.name || '') || !item.file) throw new Error('Not a PDF');
  if (item.size > MAX_DECK_BYTES) throw new Error('Too large');

  const link = await graphFetch(`/me/drive/items/${encodeURIComponent(itemId)}/createLink`, {
    method: 'POST',
    body: JSON.stringify({ type: 'view', scope: 'organization' }),
  });
  return { url: link.link?.webUrl || item.webUrl, fileName: item.name };
}
