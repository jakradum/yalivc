import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const INVITE_EXPIRY_HOURS = 72; // 3 days for manually-sent invites

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://yali.vc',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function buildInviteToken(email, expiry) {
  const payload = Buffer.from(JSON.stringify({ email, expiry })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}


// POST — called from Sanity Studio action to send a manual portal invite
export async function POST(request) {
  if (!AUTH_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: CORS_HEADERS });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  const { email, name } = body ?? {};
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: CORS_HEADERS });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const expiry = Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000;
  const token = buildInviteToken(normalizedEmail, expiry);
  const magicLink = `https://partners.yali.vc/api/portal-invite/?verify=${token}`;

  const resend = new Resend(RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'Yali Partners <noreply@yali.vc>',
      to: normalizedEmail,
      subject: "You've been invited to the Yali Capital LP Portal",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yali Capital &#8212; LP Portal Invitation</title>
<style>
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
  .greeting { font-family: 'Inter', sans-serif; font-size: 15px; color: #363636; line-height: 1.7; margin-bottom: 24px; }
  .section-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #830d35; margin-bottom: 16px; }
  .feature-list { list-style: none; margin-bottom: 36px; }
  .feature-list li { font-family: 'Inter', sans-serif; font-size: 14px; color: #363636; padding: 12px 0 12px 20px; border-bottom: 1px solid #d8d8d8; position: relative; line-height: 1.5; }
  .feature-list li:first-child { border-top: 1px solid #d8d8d8; }
  .feature-list li::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 6px; height: 6px; background: #830d35; }
  .cta-block { background: #363636; padding: 32px 40px; text-align: center; margin: 0 -40px; }
  .cta-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #ebde84; margin-bottom: 20px; }
  .cta-button { display: inline-block; background: #830d35; color: #efefef; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 18px 48px; }
  .access-note { padding: 28px 40px; border-left: 3px solid #ebde84; margin: 36px 0 0; background: #e8e8e8; }
  .access-note p { font-family: 'Inter', sans-serif; font-size: 13px; color: #363636; line-height: 1.7; }
  .footer { padding: 32px 40px; border-top: 1px solid #d0d0d0; }
  .footer-contact { font-family: 'Inter', sans-serif; font-size: 13px; color: #555; line-height: 1.8; margin-bottom: 24px; }
  .footer-contact a { color: #830d35; text-decoration: none; }
  .footer-divider { border: none; border-top: 1px solid #d0d0d0; margin: 24px 0; }
  .footer-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #999; letter-spacing: 0.1em; text-transform: uppercase; }
  @media (max-width: 480px) {
    .hero-title { font-size: 22px; }
    .body, .footer, .header { padding-left: 24px; padding-right: 24px; }
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-tag">LP Portal</div>
  </div>
  <div class="hero">
    <img src="https://yali.vc/yali-logo.png" alt="Yali Capital" style="position: absolute; top: 20px; right: 32px; height: 24px; width: auto; filter: brightness(0) invert(1);" />
    <div class="hero-label">Investor Access</div>
    <div class="hero-title">You&#8217;ve been invited to view the <span>LP Portal</span></div>
  </div>
  <div class="body">
    <p class="greeting">
      This email is an invitation to access the Yali Capital LP Portal: a secure environment built exclusively for our limited partners. Inside, you will find:
    </p>
    <div class="section-label">What&#8217;s inside</div>
    <ul class="feature-list">
      <li>Quarterly reports covering fund performance and portfolio updates</li>
      <li>Fund-level metrics including drawn capital, FMV, TVPI, DPI, and IRR</li>
      <li>Portfolio company updates with revenue, team growth, and key milestones</li>
      <li>Pipeline visibility into investments under evaluation</li>
    </ul>
    <div class="cta-block">
      <div class="cta-label">Access the portal</div>
      <a href="${magicLink}" class="cta-button" style="color: #efefef !important;">Click to Access Portal</a>
    </div>
    <div class="access-note">
      <p>
        Your session will remain active for <strong>12 weeks</strong> from first sign-in. After that, you can request a one-time code to re-authenticate yourself at any time.
      </p>
    </div>
  </div>
  <div class="footer">
    <div class="footer-contact">
      Should you have any concerns with accessing the portal, please write to us at<br>
      <a href="mailto:investor-relations@yali.vc">investor-relations@yali.vc</a> or <a href="mailto:sunil@yali.vc">sunil@yali.vc</a>
    </div>
    <hr class="footer-divider">
    <div class="footer-meta">Yali Capital &nbsp;&middot;&nbsp; Confidential &nbsp;&middot;&nbsp; For authorised recipients only</div>
  </div>
</div>
</body>
</html>`,
    });
  } catch (err) {
    console.error('Failed to send portal invite email:', err);
    return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
