// Who gets which leave email:  node scripts/leave-email-check.mjs
import { planEmails } from '../src/lib/leaveEmail/plan.js';
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log('FAIL', m)); };
const leave = (name, status, extra = {}) => ({ kind: 'leave', name, type: 'paid', from: '2026-10-19', to: '2026-10-23', days: 5, status, left: 3, remaining: 2, ...extra });
const to = (p) => p.emails.map((e) => e.to);

ok(JSON.stringify(to(planEmails(leave('Ajay Soni', 'pending')))) === '["ajay@yali.vc","sunil@yali.vc"]', 'pending: applicant + Sunil');
ok(JSON.stringify(to(planEmails(leave('Ajay Soni', 'auto-approved')))) === '["ajay@yali.vc"]', 'auto-approved: applicant only');
ok(JSON.stringify(to(planEmails(leave('Shivakumar', 'pending')))) === '["sunil@yali.vc"]', 'no-email applicant, pending: Sunil only');
ok(to(planEmails(leave('Shivakumar', 'auto-approved'))).length === 0, 'no-email applicant, auto-approved: nobody');
{
  const p = planEmails(leave('Sunil', 'pending'));
  ok(JSON.stringify(to(p)) === '["sunil@yali.vc"]', 'Sunil asking: one email, not two');
  ok(p.emails[0].subject.startsWith('Leave logged') && !/approv/i.test(p.emails[0].html), 'Sunil own leave: "logged", no approval wording');
  ok(p.emails[0].html.includes('\u22122 days'), 'negative balance shown (3 left, 5 taken = -2)');
  ok(planEmails(leave('Sunil', 'auto-approved')).emails[0].subject.startsWith('Leave logged'), 'Sunil auto-approved: same logged mail');
}
ok(planEmails(leave('Ajay Soni', 'pending', { left: -1 })).emails[0].html.includes('\u22126 days'), 'applicant already negative: balance after shown');
ok(JSON.stringify(to(planEmails(leave('  kaushik RAM ', 'pending')))) === '["kram@yali.vc","sunil@yali.vc"]', 'name matched case/space-insensitively');
ok(planEmails(leave('Mohan', 'pending')).error, 'Mohan (left) is rejected');
ok(planEmails(leave('Nobody', 'pending')).error, 'unknown name rejected');
ok(planEmails({ ...leave('Ajay Soni', 'pending'), to: '2026-10-01' }).error, 'end before start rejected');
ok(planEmails({ ...leave('Ajay Soni', 'pending'), days: 9999 }).error, 'silly day count rejected');
ok(planEmails({ kind: 'wfh', name: 'Ajay Soni', date: '2026-10-14' }).emails.length === 1, 'wfh: applicant only');
ok(planEmails({ kind: 'weekend', name: 'Shivakumar', date: '2026-10-11' }).emails.length === 0, 'weekend off (no email): nothing sent');
ok(planEmails({ kind: 'nope', name: 'Ajay Soni' }).error, 'unknown kind rejected');
// Injection: recipient can only come from the directory, and text is escaped
const evil = planEmails({ ...leave('Ajay Soni', 'pending'), to_email: 'x@evil.com', cc: 'x@evil.com' });
ok(!to(evil).includes('x@evil.com'), 'request cannot add recipients');
ok(!planEmails({ kind: 'wfh', name: 'Ajay Soni', date: '2026-10-14', offPattern: true }).emails[0].html.includes('<script'), 'no script');
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
