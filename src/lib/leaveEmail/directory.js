// Who gets leave emails. Keys are the exact `name` on the Firestore employee record
// (the leave form sends that name). No address = no email to that person; leave from
// someone with no address reaches Sunil only. Mohan has left and is deliberately absent.
export const EMAILS = {
  'Ajay Soni': 'ajay@yali.vc',
  'Ganapathy Subramaniam': 'gani@yali.vc',
  'Karthik Madathil': 'karthik@yali.vc',
  'Karthik Sunder': 'skarthikeyan@yali.vc',
  'Kaushik Ram': 'kram@yali.vc',
  Manjunath: 'manjunath@yali.vc',
  'Pranav Karnad': 'pranav@yali.vc',
  'Sandipan Mondal': 'sandipan@yali.vc',
  Shivakumar: null, // office boy, no email access
  Sunil: 'sunil@yali.vc',
};
export const APPROVER = { name: 'Sunil', email: 'sunil@yali.vc' };
// May log leave / WFH / travel for anyone (e.g. Shivakumar, who has no Microsoft
// account). Everyone else only sees their own name on the team forms.
export const LOGS_FOR_OTHERS = ['sunil@yali.vc', 'manjunath@yali.vc'];
// Narrower: may also log for these specific people, on top of themselves.
export const LOGS_FOR = {
  'skarthikeyan@yali.vc': ['Shivakumar'],
};
export const APPROVE_URL = 'https://team.yali.vc/admin';

const byLower = new Map(Object.keys(EMAILS).map((n) => [n.toLowerCase(), n]));
// Canonical employee name for whatever the form sent, or null if unknown.
export const canonicalName = (raw) => byLower.get(String(raw || '').trim().toLowerCase()) ?? null;
// Directory name for a signed-in Yali address, or null if they aren't in the directory.
export const nameForEmail = (email) =>
  Object.keys(EMAILS).find((n) => EMAILS[n] && EMAILS[n] === String(email || '').toLowerCase()) ?? null;
// Names this signed-in person may submit for.
export function allowedNamesFor(email) {
  const e = String(email || '').toLowerCase();
  if (LOGS_FOR_OTHERS.includes(e)) return Object.keys(EMAILS);
  return [...new Set([nameForEmail(e), ...(LOGS_FOR[e] || [])].filter(Boolean))];
}
