import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { Resend } from 'resend';

const WEBHOOK_SECRET = process.env.SANITY_INVITE_WEBHOOK_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const INVITE_EXPIRY_HOURS = 24;

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

// Validate Sanity webhook signature
// Sanity signs with: HMAC-SHA256(`${timestamp}.${rawBody}`, secret)
// Header format: `t=TIMESTAMP,v1=SIGNATURE`
async function validateWebhookSignature(request, rawBody) {
  if (!WEBHOOK_SECRET) return false;
  const signatureHeader = request.headers.get('sanity-webhook-signature');
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=')));
  const { t: timestamp, v1: signature } = parts;
  if (!timestamp || !signature) return false;

  // Reject if timestamp is more than 5 minutes old
  if (Math.abs(Date.now() - parseInt(timestamp, 10) * 1000) > 5 * 60 * 1000) return false;

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

export async function POST(request) {
  const rawBody = await request.text();

  const isValid = await validateWebhookSignature(request, rawBody);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let doc;
  try {
    doc = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Sanity sends the document as the payload body
  const { _id, _type, email, name, isActive } = doc;

  if (_type !== 'portalUser' || !email || !isActive) {
    return NextResponse.json({ skipped: true });
  }

  // Generate 6-digit invite code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  // Store code + expiry on the portalUser document
  try {
    await writeClient
      .patch(_id)
      .set({ inviteCode: code, inviteCodeExpiry: expiry })
      .commit();
  } catch (err) {
    console.error('Failed to store invite code in Sanity:', err);
    return NextResponse.json({ error: 'Failed to store invite code' }, { status: 500 });
  }

  // Send invite email
  const resend = new Resend(RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'Yali Partners <noreply@yali.vc>',
      to: email.toLowerCase().trim(),
      subject: "You've been invited to view the Yali Limited Partners' Report",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">
          <!-- Letterhead -->
          <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 0; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
            <img src="https://yali.vc/yali-logo.png" alt="Yali Partners" style="height: 36px; width: auto;" />
            <div style="text-align: right;">
              <div style="font-size: 14px; font-weight: 600; color: #830D35;">Yali Partners LLP</div>
              <div style="font-size: 12px; color: #666;">Limited Partners' Reports</div>
            </div>
          </div>

          <!-- Body -->
          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">Hi${name ? ` ${name}` : ''},</p>
          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">You've been invited to view the Yali Limited Partners' Report.</p>
          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Use <strong>${email.toLowerCase().trim()}</strong> to log in, and the one-time code below to authenticate yourself. This code is valid for ${INVITE_EXPIRY_HOURS} hours.
          </p>

          <!-- Code -->
          <div style="background: #f5f5f5; padding: 24px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.4em; color: #1a1a1a;">${code}</span>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 0 0 32px 0;">
            <a href="https://yali.vc/partners/sign-in" style="display: inline-block; background: #830D35; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 600; letter-spacing: 0.02em;">Go to Partners Portal</a>
          </div>

          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0 0 32px 0;">
            If you were not expecting this invitation, you can safely ignore this email.
          </p>

          <!-- Footer -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 16px;">
            <p style="color: #999; font-size: 11px; line-height: 1.4; margin: 0; text-align: center;">This is a system-generated email. Please do not reply.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send invite email:', err);
    return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
