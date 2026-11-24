// Team work emails shown on the data room team page. They are not public, so they
// live in Supabase (one `teamMemberEmails` document: emails[] of { member, email },
// member = the Sanity teamMember _id) rather than on the teamMember documents.
// Moved out of Sanity on 24 Nov 2026; edits go through Claude. Server-side only.
import { getDoc } from './private-docs.js';

export async function withTeamEmails(members) {
  const doc = await getDoc('teamMemberEmails').catch((err) => {
    console.error('Failed to read team emails:', err.message);
    return null;
  });
  const byMember = new Map((doc?.emails || []).map((e) => [e.member, e.email]));
  return members.map((m) => ({ ...m, emailId: byMember.get(m._id) || null }));
}
