import { EMAILS, APPROVER, APPROVE_URL, canonicalName } from './directory.js';
import { renderLeaveEmail, renderApproverEmail } from './templates.js';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);

// Validates what the leave form reports and decides who is emailed what. Pure: returns
// { emails: [{to, subject, html}], why } and never sends. Recipients come ONLY from the
// directory, never from the request, so this can't be used to mail arbitrary addresses.
export function planEmails(body) {
  const name = canonicalName(body?.name);
  if (!name) return { error: 'Unknown employee.' };
  const kind = body.kind;
  const req = { kind, name };
  if (kind === 'leave') {
    if (!ISO.test(body.from) || !ISO.test(body.to) || body.to < body.from) return { error: 'Bad dates.' };
    req.from = body.from; req.to = body.to;
    req.days = int(body.days, 1, 60);
    req.type = body.type === 'medical' ? 'medical' : 'paid';
    req.status = body.status === 'pending' ? 'pending' : 'auto-approved';
    req.left = int(body.left, -365, 365) ?? 0; // balances can be negative
    req.remaining = int(body.remaining, -365, 365);
    if (!req.days) return { error: 'Bad day count.' };
  } else if (kind === 'wfh' || kind === 'weekend') {
    if (!ISO.test(body.date)) return { error: 'Bad date.' };
    req.date = body.date;
    req.offPattern = body.offPattern === true;
  } else {
    return { error: 'Unknown request kind.' };
  }

  const emails = [];
  const own = EMAILS[name];
  req.self = kind === 'leave' && own === APPROVER.email; // the approver's own leave
  if (own) emails.push({ to: own, ...renderLeaveEmail(req) });
  // Sunil hears about a leave request only when it needs his approval, and not when he
  // is the one asking.
  if (kind === 'leave' && req.status === 'pending' && own !== APPROVER.email) {
    emails.push({ to: APPROVER.email, ...renderApproverEmail(req, { approveUrl: APPROVE_URL }) });
  }
  return { emails };
}
