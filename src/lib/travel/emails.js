// Travel desk emails, in the same letterhead layout as the leave emails. Pure:
// builds { to, cc?, subject, html } and never sends. Recipients come only from the
// directory and profiles, never from the request body.
import 'server-only';
import { layoutA, fmtDate } from '@/lib/leaveEmail/templates';
import { EMAILS } from '@/lib/leaveEmail/directory';
import { TRAVELLERS, TRAVEL_APPROVER, TRAVEL_BOOKER } from './profiles';

export const APPROVALS_URL = 'https://team.yali.vc/travel/approvals';

const route = (r) => `${r.from} to ${r.to}${r.retDate ? ' (return)' : ' (one way)'}`;
const dates = (r) => (r.retDate ? `${fmtDate(r.depDate)}, back ${fmtDate(r.retDate)}` : fmtDate(r.depDate));
const yesNo = (b) => (b ? 'Yes' : 'No');
const subjectBit = (r) => `${r.from} to ${r.to}, ${fmtDate(r.depDate)}`;

function tripRows(r) {
  return [
    ['Requested by', r.requester],
    ['Travellers', r.travellers.join(', ')],
    ['Route', route(r)],
    ['Dates', dates(r)],
    ...(r.purpose ? [['Purpose', r.purpose]] : []),
    ...(r.prefTiming ? [['Preferred timing', r.prefTiming]] : []),
    ...(r.prefFlight ? [['Preferred flight', r.prefFlight]] : []),
    ['Cab', yesNo(r.cab)],
    ['Hotel room', yesNo(r.hotel)],
    ...(r.notes ? [['Notes', r.notes]] : []),
    ...(r.screenshotUrl ? [['Flight screenshot', r.screenshotUrl]] : []),
  ];
}

// The travel desk needs each passenger's booking profile, frequent-flyer numbers
// included. This is the only place they leave the server.
function passengerRows(r) {
  return r.travellers.flatMap((name, i) => {
    const p = TRAVELLERS[name];
    if (!p) return [[`Passenger ${i + 1}`, name]];
    const bits = [`Class: ${p.cls}`, `Seat: ${p.seat}`, `Meal: ${p.meal || 'NA'}`, `Frequent flyer: ${p.ff || 'NA'}`];
    if (r.hotel) bits.push(`Hotel budget: ${p.hotelBudget}`);
    return [[`Passenger ${i + 1}`, `${p.bookingName} | ${bits.join(' | ')}`]];
  });
}

export function approvalNeededEmail(r) {
  const first = r.requester.split(' ')[0];
  return {
    to: TRAVEL_APPROVER.email,
    subject: `Travel approval needed: ${subjectBit(r)}`,
    html: layoutA({
      eyebrow: 'Approval needed',
      headline: 'Flight booking request',
      intro: `${first} has asked for approval on the trip below.`,
      rows: tripRows(r),
      note: 'Approve or reject on the team portal with your Yali Microsoft sign-in. Once approved, Karthik Sunder books it with the travel desk.',
      cta: { label: 'Review and approve', url: APPROVALS_URL },
    }),
  };
}

export function receivedEmail(r) {
  const to = EMAILS[r.requester];
  if (!to) return null;
  return {
    to,
    subject: `Travel request received: ${subjectBit(r)}`,
    html: layoutA({
      eyebrow: 'Travel desk',
      headline: 'Request received',
      intro: `Hi ${r.requester.split(' ')[0]}, your flight booking request has gone to Gani for approval. You'll hear back by email.`,
      rows: tripRows(r),
      note: null,
    }),
  };
}

export function bookingEmail(r) {
  const cc = EMAILS[r.requester];
  return {
    to: TRAVEL_BOOKER.email,
    ...(cc && cc !== TRAVEL_BOOKER.email ? { cc } : {}),
    subject: `Approved, please book: ${subjectBit(r)}`,
    html: layoutA({
      eyebrow: 'Approved by Gani',
      headline: 'Please book with the travel desk',
      intro: `Hi Karthik, Gani has approved the trip below. Please forward it to the travel desk for booking.`,
      rows: [...tripRows(r), ...passengerRows(r)],
      note: 'Passenger details include frequent-flyer numbers. Share them only with the travel desk.',
    }),
  };
}

export function rejectedEmail(r) {
  const to = EMAILS[r.requester];
  if (!to) return null;
  return {
    to,
    subject: `Travel request not approved: ${subjectBit(r)}`,
    html: layoutA({
      eyebrow: 'Travel desk',
      headline: 'Request not approved',
      intro: `Hi ${r.requester.split(' ')[0]}, Gani didn't approve the trip below. Speak to him if you'd like to change it and resubmit.`,
      rows: tripRows(r),
      note: null,
    }),
  };
}
