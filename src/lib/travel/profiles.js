// Travel desk: who can travel, and how they fly. Server-only on purpose — the
// frequent-flyer numbers must never reach the browser or git. The form only ever
// sees names and seat/class/meal; the full profile goes only in the booking email.
//
// Keys are the directory names in src/lib/leaveEmail/directory.js, so requesters
// and travellers resolve to the same people. `bookingName` is the name as on ID,
// which is what the travel desk needs.
import 'server-only';

export const TRAVELLERS = loadProfiles();

// The profiles are personal data (frequent-flyer numbers, meal and seat
// preferences) and this repo is public, so they are NOT in code. They come from
// the TRAVEL_PROFILES_JSON env var (Vercel + .env.local): a JSON object keyed by
// directory name, e.g.
//   {"<Directory Name>":{"bookingName":"<name as on ID>","cls":"Economy","seat":"Aisle",
//    "meal":"Veg Meal","ff":"IndiGo BluChip: <number>" | null,"hotelBudget":"8K to 10K"}, ...}
function loadProfiles() {
  try {
    const parsed = JSON.parse(process.env.TRAVEL_PROFILES_JSON || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('[travel] TRAVEL_PROFILES_JSON is not valid JSON:', e.message);
    return {};
  }
}

// Approves travel. Signs in at /travel/approvals with their Yali Microsoft account.
export const TRAVEL_APPROVER = { name: 'Ganapathy Subramaniam', email: 'gani@yali.vc' };
// Receives approved requests with full passenger details and books them with the
// travel desk.
export const TRAVEL_BOOKER = { name: 'Karthik Sunder', email: 'skarthikeyan@yali.vc' };

// What the request form is allowed to see.
export const publicTravellerList = () =>
  Object.entries(TRAVELLERS).map(([name, p]) => ({ name, cls: p.cls, seat: p.seat, meal: p.meal }));
