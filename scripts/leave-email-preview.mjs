// Local preview of the leave-confirmation email layouts:
//   node scripts/leave-email-preview.mjs   (writes .preview/leave-email.html, opens it)
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { renderLeaveEmail, renderApproverEmail } from '../src/lib/leaveEmail/templates.js';

const samples = [
  ['Leave, needs approval', { kind: 'leave', name: 'Priya Sharma', type: 'paid', from: '2026-10-19', to: '2026-10-23', days: 5, status: 'pending', left: 3 }],
  ['Leave, auto-approved', { kind: 'leave', name: 'Priya Sharma', type: 'medical', from: '2026-10-08', to: '2026-10-08', days: 1, status: 'auto-approved', remaining: 6 }],
  ['Sunil own leave (his balance can go negative)', { kind: 'leave', name: 'Sunil', type: 'paid', from: '2026-10-19', to: '2026-10-23', days: 5, status: 'pending', left: 3, self: true }],
  ['To Sunil: approval needed (also the only email if the applicant has no address)', { kind: 'leave', name: 'Priya Sharma', type: 'paid', from: '2026-10-19', to: '2026-10-23', days: 5, status: 'pending', left: 3, approver: true }],
  ['WFH logged', { kind: 'wfh', name: 'Priya Sharma', date: '2026-10-14', offPattern: true }],
  ['Weekend off', { kind: 'weekend', name: 'Priya Sharma', date: '2026-10-11' }],
];
const cell = (html) => `srcdoc="${html.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
let body = '';
for (const [title, req] of samples) {
  body += `<h2>${title}</h2><div class="row">`;
  {
    const { subject, html } = req.approver ? renderApproverEmail(req, { approveUrl: 'https://team.yali.vc/admin' }) : renderLeaveEmail(req);
    body += `<div class="col"><div class="meta">To: ${req.approver ? 'sunil@yali.vc' : req.name}<br>Subject: ${subject}</div><iframe ${cell(html)} title="${title}"></iframe></div>`;
  }
  body += '</div>';
}
const page = `<!doctype html><meta charset="utf-8"><title>Leave email options</title><style>body{font:14px Inter,Arial,sans-serif;background:#e4e2df;margin:0;padding:24px}h1{font-size:20px}h2{margin:32px 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#830d35}.row{display:flex;gap:16px;align-items:flex-start}.col{width:640px}.meta{font-size:12px;color:#555;margin-bottom:6px;line-height:1.5}iframe{width:100%;height:620px;border:1px solid #ccc;background:#fff}</style><h1>Leave confirmation email: letterhead</h1>${body}`;
mkdirSync('.preview', { recursive: true });
writeFileSync('.preview/leave-email.html', page);
console.log('wrote .preview/leave-email.html');
if (process.argv.includes('--open')) execFile('open', ['.preview/leave-email.html']);
