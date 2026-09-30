import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { createMeetingEvent } from '@/lib/graphCalendar';

// Studio-triggered - the ApproveMeetingButton component (on the invitation
// document) calls this once Pranav has reviewed/edited the draft subject and
// body it prefilled. Re-derives the attendee list and slot time from Sanity
// itself rather than trusting the client for anything beyond the
// edited subject/body/format/addressLink - same posture as
// pitch-scheduler-submit.

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const INVESTMENT_TEAM = 'investment-team@yali.vc';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://yali.vc',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  const { docId, subject, bodyText, format, addressLink } = body || {};
  if (!docId || !subject || !bodyText || !['virtual', 'in-person'].includes(format)) {
    return NextResponse.json({ error: 'docId, subject, bodyText and a valid format are required' }, { status: 400, headers: CORS_HEADERS });
  }

  const invitation = await writeClient.fetch(
    `*[_id == $docId][0]{ status, companyName, founderEmail, teammateEmails, selectedSlotId, slots, calendarEventId }`,
    { docId }
  );

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404, headers: CORS_HEADERS });
  }
  if (invitation.calendarEventId) {
    return NextResponse.json({ error: 'A calendar event was already created for this invitation' }, { status: 409, headers: CORS_HEADERS });
  }
  if (invitation.status !== 'submitted') {
    return NextResponse.json({ error: `Can only approve a submitted invitation (current status: ${invitation.status})` }, { status: 409, headers: CORS_HEADERS });
  }
  if (!invitation.founderEmail) {
    return NextResponse.json({ error: 'Invitation has no contact email on file' }, { status: 400, headers: CORS_HEADERS });
  }

  const slot = (invitation.slots || []).find((s) => s.slotId === invitation.selectedSlotId);
  if (!slot) {
    return NextResponse.json({ error: 'Could not find the selected slot on this invitation' }, { status: 400, headers: CORS_HEADERS });
  }

  const attendeeEmails = [INVESTMENT_TEAM, invitation.founderEmail, ...(invitation.teammateEmails || [])];

  const event = await createMeetingEvent({
    subject,
    bodyText,
    startISO: slot.startUTC,
    endISO: slot.endUTC,
    attendeeEmails,
  });

  if (!event) {
    return NextResponse.json(
      { error: 'Calendar not reachable - not connected, scope not widened to Calendars.ReadWrite, or Graph errored.' },
      { status: 502, headers: CORS_HEADERS }
    );
  }

  const patch = {
    status: 'scheduled',
    meetingFormat: format,
    addressLink: format === 'in-person' ? (addressLink || '') : undefined,
    calendarEventId: event.id,
  };
  // Sanity's patch.set ignoring undefined-valued keys at the JSON layer
  // isn't guaranteed - strip them explicitly (same as pitch-scheduler-invite-manual).
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

  try {
    await writeClient.patch(docId).set(patch).commit();
  } catch (err) {
    console.error('Event created but failed to save invitation state:', err);
    return NextResponse.json(
      { error: 'Calendar event was created, but failed to update the invitation record - check Studio.', eventId: event.id },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { success: true, eventId: event.id, webLink: event.webLink, joinUrl: event.onlineMeeting?.joinUrl ?? null },
    { headers: CORS_HEADERS }
  );
}
