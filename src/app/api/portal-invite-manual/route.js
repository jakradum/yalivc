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
      subject: "You've been invited to view the Yali Limited Partners' Report",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">
          <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 0; margin-bottom: 24px;">
            <img src="https://yali.vc/yali-logo.png" alt="Yali Partners" style="height: 36px; width: auto;" />
          </div>

          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">Hi${name ? ` ${name}` : ''},</p>
          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">You've been invited to view the Yali Limited Partners' Report.</p>
          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Use the button below to access the portal. This link is valid for ${INVITE_EXPIRY_HOURS} hours.
          </p>

          <div style="text-align: center; margin: 0 0 32px 0;">
            <a href="${magicLink}" style="display: inline-block; background: #830D35; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 600; letter-spacing: 0.04em;">Access Partners Portal</a>
          </div>

          <p style="color: #666; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">Or copy this link into your browser:</p>
          <p style="color: #830D35; font-size: 12px; line-height: 1.5; margin: 0 0 32px 0; word-break: break-all;">${magicLink}</p>

          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0 0 32px 0;">
            If you were not expecting this invitation, you can safely ignore this email.
          </p>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 16px;">
            <p style="color: #999; font-size: 11px; line-height: 1.4; margin: 0; text-align: center;">This is a system-generated email. Please do not reply.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send portal invite email:', err);
    return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
