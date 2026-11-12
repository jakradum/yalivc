import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { leaveForWeek, clearLeaveEndingBy } from '@/lib/leaveEmail/upcoming';
import { renderWeeklyDigest } from '@/lib/leaveEmail/weeklyDigest';
import { PHOTOS } from '@/lib/leaveEmail/photos';
import { DISPLAY_NAMES } from '@/lib/leaveEmail/displayNames';
import { EMAILS } from '@/lib/leaveEmail/directory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const FROM = process.env.LEAVE_MAIL_FROM || 'Yali Team Portal <noreply@yali.vc>';
const NOREPLY = 'noreply@yali.vc'; // To, when nobody on leave has an email address

function mondayOfThisWeek(now) {
  // now is a wall-clock Date in IST (see below); Monday..Sunday of the week it falls in.
  const day = now.getDay(); // 0 = Sunday
  const back = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - back);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { mondayISO: iso(monday), sundayISO: iso(sunday) };
}

// Vercel Cron, Monday 11:00 IST (05:30 UTC, see vercel.json). Reads this week's
// leave, approved or still pending, from Supabase (leave_upcoming) and sends ONE
// email, but only if someone is actually on leave; an empty week sends nothing.
// To: the people on leave (or our own noreply address if none of them has email);
// Bcc: everyone else in the directory, so the staff list isn't shown. Once sent,
// leave that ends this week is deleted.
//
// ?week=YYYY-MM-DD (any day in the week) and ?to=<directory address> are for a
// test send: only that address gets it, nothing deleted; the response shows the
// To/Bcc split the real send would use.
export async function GET(request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Not found', { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const testTo = params.get('to');
  const staff = Object.values(EMAILS).filter(Boolean);
  if (testTo && !staff.includes(testTo.toLowerCase())) {
    return NextResponse.json({ error: 'Test recipient must be in the directory.' }, { status: 400 });
  }
  const week = params.get('week');
  // IST wall-clock date, independent of the server's own time zone.
  const nowIST = /^\d{4}-\d{2}-\d{2}$/.test(week || '')
    ? new Date(`${week}T12:00:00`)
    : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const { mondayISO, sundayISO } = mondayOfThisWeek(nowIST);

  let leave;
  try {
    leave = await leaveForWeek(mondayISO, sundayISO);
  } catch (err) {
    console.error('[leave-digest] Supabase read failed:', err?.status || err?.message);
    return NextResponse.json({ error: 'Could not read leave requests.' }, { status: 500 });
  }

  if (leave.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'nobody on leave this week' });
  }

  const entries = leave.map((e) => ({ ...e, name: DISPLAY_NAMES[e.name] || e.name, photoUrl: PHOTOS[e.name] }));
  const html = renderWeeklyDigest(entries);
  const onLeave = [...new Set(leave.map((e) => EMAILS[e.name]).filter(Boolean))];
  const plan = { to: onLeave.length ? onLeave : [NOREPLY], bcc: staff.filter((a) => !onLeave.includes(a)) };
  const message = testTo
    ? { to: [testTo.toLowerCase()], subject: '[Test] On leave this week' }
    : { ...plan, subject: 'On leave this week' };

  if (!process.env.RESEND_API_KEY) {
    console.log('[leave-digest] dry run:', plan);
    return NextResponse.json({ sent: false, dryRun: true, plan, entries: leave.length });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, ...message, html });
  if (error) {
    console.error('[leave-digest] Resend error:', error);
    return NextResponse.json({ error: 'Send failed.' }, { status: 502 });
  }

  let cleared = false;
  if (!testTo) {
    try {
      await clearLeaveEndingBy(sundayISO);
      cleared = true;
    } catch (err) {
      console.error('[leave-digest] clean-up failed:', err?.status || err?.message);
    }
  }
  return NextResponse.json({ sent: true, test: Boolean(testTo), plan, entries: leave.length, cleared });
}
