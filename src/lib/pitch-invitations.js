// Pitch scheduler invitations, kept in Supabase as `pitchSchedulerInvitation`
// documents (same shape as the Sanity documents they replaced on 24 Nov 2026).
// Created from team.yali.vc/pitch-invites; read and updated by the founder-facing
// /api/pitch-scheduler-* routes. Server-side only.
import { listDocs, createDoc, patchDoc, patchDocIfRev } from './private-docs.js';

const TYPE = 'pitchSchedulerInvitation';

export const listInvitations = () => listDocs(TYPE);

export async function findInvitation(invitationId) {
  if (typeof invitationId !== 'string' || !invitationId) return null;
  return (await listInvitations()).find((d) => d.invitationId === invitationId) || null;
}

export const createInvitation = (fields) => createDoc(TYPE, fields);

// Merge fields into an invitation (best-effort bookkeeping such as notificationStatus).
export const updateInvitation = (id, fields) => patchDoc(id, (d) => ({ ...d, ...fields }));

// Single-use claim: only succeeds if nobody changed the invitation since it was read.
export const claimInvitation = (doc, fields) => patchDocIfRev(doc._id, doc._rev, (d) => ({ ...d, ...fields }));
