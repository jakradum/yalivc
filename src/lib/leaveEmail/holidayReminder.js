import { Resend } from 'resend';
import { holidaysToAnnounce } from './holidays';
import { renderHolidayEmail } from './templates';

const FROM = process.env.LEAVE_MAIL_FROM || 'Yali Team Portal <noreply@yali.vc>';
// Deliberately not the leave directory: the investment-team alias plus the two operations
// people who aren't on it, as chosen by Pranav.
const RECIPIENTS = ['investment-team@yali.vc', 'skarthikeyan@yali.vc', 'manjunath@yali.vc', 'ajay@yali.vc'];

// Piggybacks on the pitch scheduler's hourly cron-job.org call (see
// /api/cron/pitch-scheduler-refresh-slots), so it only acts in the 10:00-10:29 IST window -
// one of those hourly calls lands there - and sends nothing unless today is the last
// working day before an office holiday. Never throws: a failure here must not break the
// slot refresh it rides along with.
export async function sendHolidayReminderIfDue(now = new Date()) {
  try {
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    if (ist.getHours() !== 10 || ist.getMinutes() >= 30) return { skipped: 'outside 10:00-10:29 IST' };

    const todayISO = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
    const holidays = holidaysToAnnounce(todayISO);
    if (holidays.length === 0) return { sent: 0 };

    const { subject, html } = renderHolidayEmail(holidays);
    if (!process.env.RESEND_API_KEY) {
      console.log('[holiday-reminder] dry run:', subject, RECIPIENTS);
      return { sent: 0, dryRun: true, subject };
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to: RECIPIENTS, subject, html });
    if (error) {
      console.error('[holiday-reminder] Resend error:', error);
      return { error: 'send failed' };
    }
    return { sent: RECIPIENTS.length, subject };
  } catch (err) {
    console.error('[holiday-reminder] failed:', err);
    return { error: 'holiday reminder failed' };
  }
}
