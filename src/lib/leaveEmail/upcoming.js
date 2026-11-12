// The Supabase copy of leave that hasn't finished yet, read by the Monday digest
// (rules: supabase/migrations/0008_leave_upcoming.sql). Server only.
import 'server-only';
import { supa, enc } from '@/lib/lp-data/rest';

const TABLE = '/rest/v1/leave_upcoming';
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,100}$/;

export const isRequestId = (id) => typeof id === 'string' && ID_RE.test(id);

// One leave request, as validated by planEmails(). Re-sending the same request
// (the form retrying) overwrites the row instead of adding a second one.
export async function saveLeave({ requestId, name, from, to, type, status, days }) {
  await supa(`${TABLE}?on_conflict=request_id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: [{ request_id: requestId, name, from_date: from, to_date: to, type, status, days }],
  });
}

// Sunil's decision on the dashboard: approved updates the row, rejected removes it.
export async function decideLeave(requestId, decision) {
  if (decision === 'rejected') {
    await supa(`${TABLE}?request_id=eq.${enc(requestId)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  } else {
    await supa(`${TABLE}?request_id=eq.${enc(requestId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: { status: 'approved' },
    });
  }
}

// Every request whose dates overlap [mondayISO, sundayISO], earliest first.
// Returns [{ name, from, to, type, status }].
export async function leaveForWeek(mondayISO, sundayISO) {
  if (!ISO.test(mondayISO) || !ISO.test(sundayISO)) throw new Error('Bad week.');
  const { rows } = await supa(
    `${TABLE}?select=name,from_date,to_date,type,status&from_date=lte.${sundayISO}&to_date=gte.${mondayISO}&order=from_date.asc,name.asc`,
  );
  return (rows || []).map((r) => ({ name: r.name, from: r.from_date, to: r.to_date, type: r.type, status: r.status }));
}

// Called after the digest has gone out: drops every request that is over by the
// end of that week. Leave running into later weeks is kept.
export async function clearLeaveEndingBy(sundayISO) {
  if (!ISO.test(sundayISO)) throw new Error('Bad date.');
  await supa(`${TABLE}?to_date=lte.${sundayISO}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
}
