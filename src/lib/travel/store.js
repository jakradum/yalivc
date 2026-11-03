// Travel requests live in Sanity as `travelRequest` documents with an _id under
// "travel." — Sanity treats any _id containing a dot as private, so they can only
// be read with a token even though the production dataset is otherwise public.
// There is no Studio schema for them; /travel/approvals is the UI.
import 'server-only';
import crypto from 'crypto';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const FIELDS = `_id, _createdAt, status, requester, travellers, from, to, depDate, retDate, purpose,
  prefTiming, prefFlight, cab, hotel, notes, screenshotUrl, decidedBy, decidedAt`;

export async function createTravelRequest(data) {
  const doc = { _id: `travel.${crypto.randomUUID()}`, _type: 'travelRequest', status: 'pending', ...data };
  return client.create(doc);
}

export const listTravelRequests = () =>
  client.fetch(`*[_type == "travelRequest" && _id in path("travel.**")] | order(_createdAt desc)[0...100]{${FIELDS}}`);

export const getTravelRequest = (id) =>
  client.fetch(`*[_type == "travelRequest" && _id == $id][0]{${FIELDS}}`, { id });

// Decides a pending request. ifRevisionId makes a double-click (or two tabs)
// fail instead of deciding twice.
export async function decideTravelRequest(id, status, email) {
  const current = await client.getDocument(id);
  if (!current || current._type !== 'travelRequest') return { error: 'Not found.' };
  if (current.status !== 'pending') return { error: `Already ${current.status}.` };
  const updated = await client
    .patch(id)
    .ifRevisionId(current._rev)
    .set({ status, decidedBy: email, decidedAt: new Date().toISOString() })
    .commit();
  return { request: updated };
}

// Flight screenshot: stored as a Sanity image asset (unguessable public URL).
export async function uploadScreenshot(buffer, contentType) {
  const asset = await client.assets.upload('image', buffer, { contentType, filename: 'flight-screenshot' });
  return asset.url;
}
