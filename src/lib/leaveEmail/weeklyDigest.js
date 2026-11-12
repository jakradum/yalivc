// "On leave this week" digest, sent to the whole team every Monday 11 AM if
// (and only if) anyone is on leave that week. Plain style, matching the other
// leave emails: a card per person, their Sanity photo (initials if none), and
// their dates. Leave still waiting for Sunil's approval is listed too, with no
// status shown. Nobody on leave -> the cron route sends nothing.

const C = { crimson: '#830d35', ink: '#363636', light: '#efefef', grey: '#6b6b6b', rule: '#d9d9d9', white: '#ffffff' };
const SANS = "Inter, Arial, Helvetica, sans-serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";
const LOGO = 'https://www.yali.vc/favicon-512x512.png'; // Yali monogram only

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = (name) => String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function short(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// entries: [{ name, from, to, type: 'paid'|'medical', photoUrl? }], already
// filtered by the caller to people on leave at some point this week.
export function renderWeeklyDigest(entries) {
  const rows = entries
    .map((e) => {
      const span = e.from === e.to ? short(e.from) : `${short(e.from)} to ${short(e.to)}`;
      const avatar = e.photoUrl
        ? // Photos are transparent PNGs: crimson behind them, set on a cell so Outlook shows it too.
          `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="${C.crimson}" style="background:${C.crimson}"><img src="${esc(e.photoUrl)}" width="48" height="48" style="display:block;border-radius:0;object-fit:cover" alt=""></td></tr></table>`
        : `<div style="width:48px;height:48px;background:${C.light};color:${C.grey};font-family:${MONO};font-size:14px;line-height:48px;text-align:center">${esc(initials(e.name))}</div>`;
      return `<tr><td style="padding:14px 0;border-top:1px solid ${C.rule};width:64px">${avatar}</td><td style="padding:14px 0 14px 16px;border-top:1px solid ${C.rule}"><div style="font-family:${SANS};font-size:15px;font-weight:600;color:${C.ink}">${esc(e.name)}</div><div style="font-family:${SANS};font-size:13px;color:${C.grey};padding-top:2px">${span}</div></td></tr>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head><body style="margin:0;padding:0;background:${C.light}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.light}"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.white}">
    <tr><td style="padding:32px 32px 0"><img src="${LOGO}" width="40" alt="Yali Capital" style="display:block;border:0"></td></tr>
    <tr><td style="padding:20px 32px 18px;font-family:${MONO};font-size:24px;font-weight:700;line-height:1.2;color:${C.ink}">On leave this week</td></tr>
    <tr><td style="padding:12px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}<tr><td colspan="2" style="border-top:1px solid ${C.rule};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
    <tr><td style="height:32px;font-size:0;line-height:0">&nbsp;</td></tr>
  </table></td></tr></table></body></html>`;
}
