import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { planEmails } from '@/lib/leaveEmail/plan';
import { cookies } from 'next/headers';
import { isBuilderHost } from '@/decks/auth';
import { TEAM_COOKIE, verifyTeamSession } from '@/lib/teamSession';
import { allowedNamesFor, canonicalName } from '@/lib/leaveEmail/directory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM = process.env.LEAVE_MAIL_FROM || 'Yali Team Portal <noreply@yali.vc>';
const recent = new Map(); // best-effort duplicate guard (per server instance)
const WINDOW_MS = 10 * 60 * 1000;

// Called by the leave form (src/app/(team)/team/_apps/request-form.html) right after it
// saves a request. The caller must be signed in and may only notify for a name they're
// allowed to log for (their own, or anyone for LOGS_FOR_OTHERS). Beyond that it trusts nothing:
// employee must be in the directory, fields are validated, and recipients are fixed by
// the directory. Email is best effort: a failure here never affects the request itself.
export async function POST(request) {
  const host = request.headers.get('host') || '';
  if (!isBuilderHost(host)) return new NextResponse('Not found', { status: 404 });
  const email = verifyTeamSession((await cookies()).get(TEAM_COOKIE)?.value);
  if (!email) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!allowedNamesFor(email).includes(canonicalName(body?.name))) {
    return NextResponse.json({ error: 'You can only log leave for yourself.' }, { status: 403 });
  }
  const plan = planEmails(body);
  if (plan.error) return NextResponse.json({ error: plan.error }, { status: 400 });

  const key = JSON.stringify([body.name, body.kind, body.from, body.to, body.date]);
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > WINDOW_MS) recent.delete(k);
  if (recent.has(key)) return NextResponse.json({ sent: 0, duplicate: true });
  recent.set(key, now);

  if (process.env.LEAVE_EMAIL_DRY_RUN === '1' || !process.env.RESEND_API_KEY) {
    console.log('[leave-notify] dry run:', plan.emails.map((e) => `${e.to} :: ${e.subject}`));
    return NextResponse.json({ sent: 0, dryRun: true, would: plan.emails.map((e) => ({ to: e.to, subject: e.subject })) });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const e of plan.emails) {
    const { error } = await resend.emails.send({ from: FROM, to: e.to, subject: e.subject, html: e.html });
    if (error) console.error('[leave-notify] Resend error:', error); else sent += 1;
  }
  return NextResponse.json({ sent });
}
