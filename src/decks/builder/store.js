import 'server-only';
import { writeClient } from '@/lib/sanity';
import { codeDefaultEntries } from './catalog';

// Sanity read/write for deckManifest. Uses the raw perspective so the
// draft and published documents can be told apart.
const client = writeClient.withConfig({ perspective: 'raw' });
const MAX_LOG = 50;

export const pubId = (deckId) => `deckManifest-${deckId}`;
export const draftId = (deckId) => `drafts.${pubId(deckId)}`;

async function readDocs(deckId) {
  const docs = await client.fetch('*[_id in $ids]', { ids: [pubId(deckId), draftId(deckId)] });
  return {
    published: docs.find((d) => d._id === pubId(deckId)) || null,
    draft: docs.find((d) => d._id === draftId(deckId)) || null,
  };
}

export function entriesFromDoc(doc) {
  return (doc?.slides || []).map((s) => {
    let props = {};
    try {
      props = s.props ? JSON.parse(s.props) : {};
    } catch {
      props = {};
    }
    return { id: s.id, ref: s.ref, props, hidden: !!s.hidden };
  });
}

const slidesToDoc = (entries) =>
  entries.map((e, i) => ({
    _type: 'deckSlide',
    _key: `${e.id}`.replace(/[^a-zA-Z0-9_-]/g, '_') || `s${i}`,
    id: e.id,
    ref: e.ref,
    props: Object.keys(e.props).length ? JSON.stringify(e.props) : '',
    hidden: !!e.hidden,
  }));

// source: 'draft' → draft ?? published ?? code default; 'published' →
// published ?? code default.
export async function readManifest(deckId, source = 'published') {
  const { published, draft } = await readDocs(deckId);
  const doc = source === 'draft' ? draft || published : published;
  return {
    entries: doc ? entriesFromDoc(doc) : codeDefaultEntries(deckId),
    hasDraft: !!draft,
    hasPublished: !!published,
    log: (draft || published)?.editLog || [],
    fromCode: !doc,
  };
}

// Editing always starts from the draft, else the published doc, else the
// code default.
export async function readForEdit(deckId) {
  return readManifest(deckId, 'draft');
}

export async function saveDraft(deckId, entries, logEntry) {
  const { log } = await readForEdit(deckId);
  const editLog = logEntry ? [...log, logEntry].slice(-MAX_LOG) : log;
  await client.createOrReplace({
    _id: draftId(deckId),
    _type: 'deckManifest',
    deckId,
    slides: slidesToDoc(entries),
    editLog,
  });
}

export async function replaceLog(deckId, entries, editLog) {
  await client.createOrReplace({
    _id: draftId(deckId),
    _type: 'deckManifest',
    deckId,
    slides: slidesToDoc(entries),
    editLog,
  });
}

export async function publishDraft(deckId) {
  const { draft } = await readDocs(deckId);
  if (!draft) return false;
  const { _rev, _createdAt, _updatedAt, ...rest } = draft;
  await client.transaction().createOrReplace({ ...rest, _id: pubId(deckId) }).delete(draftId(deckId)).commit();
  return true;
}

export async function discardDraft(deckId) {
  await client.delete(draftId(deckId));
}
