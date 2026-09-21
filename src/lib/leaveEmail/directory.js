// Who gets leave emails. Keys are the exact `name` on the Firestore employee record
// (the leave form sends that name). No address = no email to that person; leave from
// someone with no address reaches Sunil only. Mohan has left and is deliberately absent.
export const EMAILS = {
  'Ajay Soni': 'ajay@yali.vc',
  'Ganapathy Subramaniam': 'gani@yali.vc',
  'Karthik Madathil': 'karthik@yali.vc',
  'Karthik Sunder': 's.karthikeyan@yali.vc',
  'Kaushik Ram': 'kram@yali.vc',
  Manjunath: 'manjunath@yali.vc',
  'Pranav Karnad': 'pranav@yali.vc',
  'Sandipan Mondal': 'sandipan@yali.vc',
  Shivakumar: null, // office boy, no email access
  Sunil: 'sunil@yali.vc',
};
export const APPROVER = { name: 'Sunil', email: 'sunil@yali.vc' };
export const APPROVE_URL = 'https://team.yali.vc/admin';

const byLower = new Map(Object.keys(EMAILS).map((n) => [n.toLowerCase(), n]));
// Canonical employee name for whatever the form sent, or null if unknown.
export const canonicalName = (raw) => byLower.get(String(raw || '').trim().toLowerCase()) ?? null;
