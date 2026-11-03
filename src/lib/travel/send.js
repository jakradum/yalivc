import 'server-only';
import { Resend } from 'resend';

const FROM = process.env.LEAVE_MAIL_FROM || 'Yali Team Portal <noreply@yali.vc>';

// Best effort, like the leave emails: a failed send is logged and never undoes the
// request or decision it reports on. LEAVE_EMAIL_DRY_RUN=1 (or no Resend key) logs
// what would be sent instead.
export async function sendAll(emails) {
  const list = emails.filter(Boolean);
  if (process.env.LEAVE_EMAIL_DRY_RUN === '1' || !process.env.RESEND_API_KEY) {
    console.log('[travel] dry run:', list.map((e) => `${e.to}${e.cc ? ` (cc ${e.cc})` : ''} :: ${e.subject}`));
    return 0;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const e of list) {
    const { error } = await resend.emails.send({ from: FROM, ...e });
    if (error) console.error('[travel] Resend error:', error); else sent += 1;
  }
  return sent;
}
