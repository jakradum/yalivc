// LP portal usage, kept in-house: one row per visit in Supabase `portal_visits`
// (rules: supabase/migrations/0007_portal_visits.sql). Read it through the
// `portal_visits_report` view. Failures are logged and swallowed, so usage tracking
// can never break the portal.
import { supa } from './lp-data/rest.js';
import { isYaliStaff } from './internal-user.js';

async function call(fn, body) {
  try {
    await supa(`/rest/v1/rpc/${fn}`, { method: 'POST', body });
  } catch (err) {
    console.error(`[visits] ${fn} failed:`, err?.status || err?.message || 'unknown');
  }
}

const who = (email) => ({ p_email: email.toLowerCase(), p_is_staff: isYaliStaff(email) });

// A heartbeat from the open portal: `seconds` of activity since the last one (capped at 60).
export const pingVisit = (email, seconds) => call('portal_visit_ping', { ...who(email), p_seconds: seconds });

// A download or a rating on the LP's current visit.
export const markVisit = (email, { downloaded = null, rating = null } = {}) =>
  call('portal_visit_mark', { ...who(email), p_downloaded: downloaded, p_rating: rating });
