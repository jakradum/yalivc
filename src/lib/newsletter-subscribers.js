// Newsletter subscribers (Tattva and the press mailing list), kept in Supabase as
// `newsletterSubscriber` documents: { email, subscribedAt, source, unsubscribed,
// unsubscribedAt, beta }. Moved out of Sanity on 24 Nov 2026.
import { listDocs, createDoc, patchDoc, deleteDocs } from './private-docs.js';

const TYPE = 'newsletterSubscriber';

export const listSubscribers = () => listDocs(TYPE);

// Adds an address, or resubscribes it if it had unsubscribed. One document per
// address: signing up twice changes nothing. Returns true when the address is
// newly (re)subscribed, false when it already was.
export async function addSubscriber(email, source) {
  const existing = (await listSubscribers()).find((s) => s.email === email);
  if (!existing) {
    await createDoc(TYPE, { email, subscribedAt: new Date().toISOString(), source });
    return true;
  }
  if (existing.unsubscribed !== true) return false;
  await patchDoc(existing._id, (d) => ({ ...d, unsubscribed: false, resubscribedAt: new Date().toISOString() }));
  return true;
}

export async function unsubscribe(email) {
  const matches = (await listSubscribers()).filter((s) => s.email === email && s.unsubscribed !== true);
  for (const s of matches) {
    await patchDoc(s._id, (d) => ({ ...d, unsubscribed: true, unsubscribedAt: new Date().toISOString() }));
  }
}

// Active addresses for a send: the full list leaves out the press mailing list;
// the beta list is only those marked beta.
export async function recipients({ beta = false } = {}) {
  return (await listSubscribers())
    .filter((s) => s.unsubscribed !== true && (beta ? s.beta === true : s.source !== 'press-mailing-list'))
    .map((s) => ({ email: s.email }));
}

export const deleteSubscribers = deleteDocs;
