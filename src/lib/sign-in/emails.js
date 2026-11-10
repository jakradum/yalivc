// The two sign-in emails (code, and lockout), shared by the LP portal and the data room.
// `place` is how the email names where you are signing in, e.g. 'LP Portal'.

// The monogram only (no text lockup), as a white PNG: mail apps ignore SVG and CSS filters.
export const MONOGRAM = 'https://www.yali.vc/email/yali-monogram-white.png';

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background-color: #d0d0d0; font-family: 'Inter', sans-serif; color: #363636; padding: 40px 20px; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #efefef; }
  .header { background: #363636; padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; }
  .header-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #ebde84; letter-spacing: 0.15em; text-transform: uppercase; }
  .hero { background: #830d35; padding: 48px 40px 40px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; top: 0; right: 0; width: 120px; height: 120px; border-left: 1px solid rgba(235,222,132,0.2); border-bottom: 1px solid rgba(235,222,132,0.2); }
  .hero-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #ebde84; margin-bottom: 16px; }
  .hero-title { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #efefef; line-height: 1.2; max-width: 420px; }
  .hero-title span { color: #ebde84; }
  .body { padding: 40px; }
  .greeting { font-family: 'Inter', sans-serif; font-size: 15px; color: #363636; line-height: 1.7; margin-bottom: 32px; }
  .code-block { background: #363636; padding: 36px 40px; text-align: center; margin: 0 -40px 0; }
  .code-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #ebde84; margin-bottom: 20px; }
  .otp-code { font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 700; color: #efefef; letter-spacing: 0.25em; }
  .expiry-note { margin-top: 16px; font-family: 'Inter', sans-serif; font-size: 12px; color: #999; letter-spacing: 0.05em; }
  .times { list-style: none; background: #363636; margin: 0 -40px; padding: 28px 40px; }
  .times li { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #efefef; line-height: 2; }
  .note { padding: 28px 40px; border-left: 3px solid #ebde84; margin: 36px 0 0; background: #e8e8e8; }
  .note p { font-family: 'Inter', sans-serif; font-size: 13px; color: #363636; line-height: 1.7; }
  .note p + p { margin-top: 10px; }
  .footer { padding: 32px 40px; border-top: 1px solid #d0d0d0; }
  .footer-contact { font-family: 'Inter', sans-serif; font-size: 13px; color: #555; line-height: 1.8; margin-bottom: 24px; }
  .footer-contact a { color: #830d35; text-decoration: none; }
  .footer-divider { border: none; border-top: 1px solid #d0d0d0; margin: 24px 0; }
  .footer-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #999; letter-spacing: 0.1em; text-transform: uppercase; }
  @media (max-width: 480px) {
    .otp-code { font-size: 36px; letter-spacing: 0.15em; }
    .hero-title { font-size: 22px; }
    .body, .footer, .header { padding-left: 24px; padding-right: 24px; }
  }`;

function page(place, title, label, heroTitle, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${STYLE}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-tag">${place}</div>
  </div>
  <div class="hero">
    <img src="${MONOGRAM}" alt="Yali Capital" width="31" height="40" style="display: block; width: 31px; height: 40px; border: 0; margin-bottom: 28px;" />
    <div class="hero-label">${label}</div>
    <div class="hero-title">${heroTitle}</div>
  </div>
  <div class="body">
${body}
  </div>
  <div class="footer">
    <div class="footer-contact">
      Questions? Write to us at <a href="mailto:investor-relations@yali.vc">investor-relations@yali.vc</a> or <a href="mailto:sunil@yali.vc">sunil@yali.vc</a>
    </div>
    <hr class="footer-divider">
    <div class="footer-meta">Yali Capital &nbsp;&middot;&nbsp; Confidential &nbsp;&middot;&nbsp; For authorised recipients only</div>
  </div>
</div>
</body>
</html>`;
}

// Times are shown in India time, with the zone named, e.g. "10 Nov 2026, 14:05 IST".
export function formatIST(iso) {
  const s = new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return `${s} IST`;
}

// The code goes in the subject so mail apps can offer to copy or fill it in.
export function codeEmail(place, code) {
  return {
    subject: `${code} is your Yali sign-in code`,
    html: page(place, 'Yali Capital &#8212; Your Sign-In Code', 'Sign-In Code', 'Your one-time <span>access code</span>', `
    <p class="greeting">Enter the code below to sign in to the Yali Capital ${place}. It works once, for up to 24 hours. If you ask for a new code, this one stops working.</p>
    <div class="code-block">
      <div class="code-label">Your code</div>
      <div class="otp-code">${code}</div>
      <div class="expiry-note">Valid for 24 hours &middot; single use only</div>
    </div>
    <div class="note">
      <p>If you did not request this code, you can safely ignore this email. Do not share this code with anyone.</p>
    </div>`),
  };
}

export function lockoutEmail(place, wrongAt, until) {
  const times = (wrongAt || []).map((t) => `<li>${formatIST(t)}</li>`).join('');
  return {
    subject: `Your Yali ${place} sign-in is locked for 24 hours`,
    html: page(place, 'Yali Capital &#8212; Sign-In Locked', 'Sign-In Locked', 'Too many <span>wrong codes</span>', `
    <p class="greeting">A wrong sign-in code was entered ${wrongAt?.length || 'several'} times for this email address, so sign-in to the Yali Capital ${place} is locked until <strong>${formatIST(until)}</strong>.</p>
    ${times ? `<ul class="times">${times}</ul>` : ''}
    <div class="note">
      <p>If this was you, you can sign in again after the time above.</p>
      <p>If it was not you, someone may be trying to get into your account. Please write to <a href="mailto:investor-relations@yali.vc">investor-relations@yali.vc</a>.</p>
    </div>`),
  };
}
