// Emails for a leave / WFH / weekend request: a confirmation to the applicant (only if
// they have an email address) and a separate approval request to Sunil.
// One layout (letterhead). Table-based with inline styles only (mail
// clients strip <style>), 600px wide, Yali brand colours and the Inter / mono stack
// used by the studio's email format. Pure functions: no I/O, safe to preview locally.

const C = { crimson: '#830d35', gold: '#ebde84', ink: '#363636', light: '#efefef', grey: '#6b6b6b', rule: '#d9d9d9', white: '#ffffff' };
const SANS = "Inter, Arial, Helvetica, sans-serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";
const LOGO = 'https://www.yali.vc/yali-logo.png';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function fmtDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return `${DAYS[new Date(y, m - 1, d).getDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
}
const plural = (n, w) => `${String(n).replace('-', '\u2212')} ${w}${n === 1 || n === -1 ? '' : 's'}`;

// req: { kind: 'leave'|'wfh'|'weekend', name, type?: 'paid'|'medical', from?, to?, days?, status?, remaining?, left?, date?, offPattern? }
export function buildContent(req) {
  const first = String(req.name || '').split(' ')[0] || 'there';
  if (req.kind === 'wfh') {
    return {
      subject: `WFH logged for ${fmtDate(req.date)}`,
      eyebrow: 'Work from home',
      headline: 'WFH logged',
      intro: `Hi ${first}, your work-from-home day has been logged.`,
      rows: [['Date', fmtDate(req.date)], ['Pattern', req.offPattern ? 'Outside your usual WFH days (logged for visibility)' : 'A usual WFH day for you']],
      note: null,
    };
  }
  if (req.kind === 'weekend') {
    return {
      subject: `Weekend off logged for ${fmtDate(req.date)}`,
      eyebrow: 'Weekend off',
      headline: 'Weekend off logged',
      intro: `Hi ${first}, your weekend day off has been recorded.`,
      rows: [['Date', fmtDate(req.date)], ['Counts as', 'Your regular weekend day (no leave used)']],
      note: null,
    };
  }
  const label = req.type === 'medical' ? 'Sick / casual leave' : 'Paid leave';
  const needsApproval = req.status === 'pending';
  const span = req.from === req.to ? fmtDate(req.from) : `${fmtDate(req.from)} to ${fmtDate(req.to)}`;
  // Balance after this request. Negative balances are shown as they are.
  const after = needsApproval ? (req.left ?? 0) - req.days : req.remaining;
  const balance = after == null ? [] : [['Balance left', plural(after, 'day')]];
  // The approver's own leave: a plain "logged" note, nothing about approval.
  if (req.self) {
    return {
      subject: `Leave logged: ${span}`,
      eyebrow: label,
      headline: 'Leave logged',
      intro: `Hi ${first}, your leave has been logged.`,
      rows: [['Dates', span], ['Working days', plural(req.days, 'day')], ...balance],
      note: null,
    };
  }
  // Approval is only mentioned when this request actually needs it (over balance). No
  // email goes out on an approval decision; this one just confirms the application.
  return {
    subject: `Leave application received: ${span}`,
    eyebrow: label,
    headline: 'Application received',
    intro: `Hi ${first}, your leave application has been received.`,
    rows: [
      ['Dates', span],
      ['Working days', plural(req.days, 'day')],
      ...(needsApproval ? [['Status', 'Subject to approval']] : []),
      ...balance,
    ],
    note: needsApproval
      ? `${plural(req.days, 'day')} were requested against a balance of ${plural(req.left ?? 0, 'day')}, so this application is subject to approval.`
      : null,
  };
}

const shell = (inner, bg = C.light) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head><body style="margin:0;padding:0;background:${bg}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg}"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.white}">${inner}</table></td></tr></table></body></html>`;
const detailRows = (rows, labelColor, valueColor, ruleColor) =>
  rows.map(([k, v]) => `<tr><td style="padding:12px 0;border-top:1px solid ${ruleColor};font-family:${MONO};font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${labelColor};width:150px;vertical-align:top">${esc(k)}</td><td style="padding:12px 0;border-top:1px solid ${ruleColor};font-family:${SANS};font-size:16px;line-height:1.4;color:${valueColor}">${esc(v)}</td></tr>`).join('');

// Letterhead: quiet, mirrors the Letters PDF: logo, mono eyebrow, hairline table.
function layoutA(c) {
  return shell(`
    <tr><td style="padding:32px 32px 0"><img src="${LOGO}" width="96" alt="Yali Capital" style="display:block;border:0"></td></tr>
    <tr><td style="padding:28px 32px 4px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.crimson}">${esc(c.eyebrow)}</td></tr>
    <tr><td style="padding:0 32px 8px;font-family:${MONO};font-size:28px;font-weight:700;line-height:1.15;color:${C.ink}">${esc(c.headline)}</td></tr>
    <tr><td style="padding:8px 32px 20px;font-family:${SANS};font-size:16px;line-height:1.5;color:${C.ink}">${esc(c.intro)}</td></tr>
    <tr><td style="padding:0 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(c.rows, C.grey, C.ink, C.rule)}<tr><td colspan="2" style="border-top:1px solid ${C.rule};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
    ${c.note ? `<tr><td style="padding:16px 32px 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${C.grey}">${esc(c.note)}</td></tr>` : ''}
    <tr><td style="height:32px;font-size:0;line-height:0">&nbsp;</td></tr>`);
}

export function renderLeaveEmail(req) {
  const c = buildContent(req);
  return { subject: c.subject, html: layoutA(c) };
}

// Separate email to the approver (Sunil). Sent when a request needs approval, and to
// him alone when the applicant has no email address.
export function renderApproverEmail(req, { approveUrl }) {
  const label = req.type === 'medical' ? 'Sick / casual leave' : 'Paid leave';
  const span = req.from === req.to ? fmtDate(req.from) : `${fmtDate(req.from)} to ${fmtDate(req.to)}`;
  const after = (req.left ?? 0) - req.days;
  const rows = [
    ['Employee', req.name],
    ['Type', label],
    ['Dates', span],
    ['Working days', plural(req.days, 'day')],
    ['Balance', `${plural(req.left ?? 0, 'day')} left, ${plural(after, 'day')} after this request`],
  ];
  const html = shell(`
    <tr><td style="padding:32px 32px 0"><img src="${LOGO}" width="96" alt="Yali Capital" style="display:block;border:0"></td></tr>
    <tr><td style="padding:28px 32px 4px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.crimson}">Approval needed</td></tr>
    <tr><td style="padding:0 32px 8px;font-family:${MONO};font-size:24px;font-weight:700;line-height:1.2;color:${C.ink}">${esc(req.name)} has requested leave</td></tr>
    <tr><td style="padding:16px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(rows, C.grey, C.ink, C.rule)}<tr><td colspan="2" style="border-top:1px solid ${C.rule};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
    <tr><td style="padding:24px 32px 32px"><a href="${esc(approveUrl)}" style="display:inline-block;background:${C.crimson};color:${C.white};font-family:${MONO};font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;padding:14px 22px">View and approve</a></td></tr>`);
  return { subject: `Leave request from ${req.name}: ${span}`, html };
}
