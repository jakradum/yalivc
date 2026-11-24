// Shared read access to the pitchSchedulerSlotCache singleton, refreshed on
// a schedule by /api/cron/pitch-scheduler-refresh-slots. Used both at
// invitation-generation time and by the founder-facing routes, which
// intersect an invitation's originally-offered slots against this cache's
// current contents so a deleted placeholder disappears from what a founder
// sees without anyone patching the invitation by hand.

// Kept in Supabase (src/lib/private-docs.js) since 24 Nov 2026, same document shape.
import { getDoc } from './private-docs.js';

export const CACHE_DOC_ID = 'pitchSchedulerSlotCache';

// Returns [{startUTC, endUTC}, ...] from the cache, or null if it's never
// been populated (cron hasn't run yet, or Graph was unreachable on every
// attempt so far).
export async function getCachedSlots() {
  const doc = await getDoc(CACHE_DOC_ID).catch((err) => {
    console.error('Failed to read slot cache:', err.message);
    return null;
  });
  return doc?.slots || null;
}

// True if a slot with this exact start/end still exists in the current
// cache - used to decide whether an invitation's originally-offered slot is
// still actually available. Compares by parsed time, not raw string, since
// Sanity's datetime field can re-serialize the ISO string slightly
// differently than what was originally written.
export function slotStillCached(startUTC, endUTC, cachedSlots) {
  const start = new Date(startUTC).getTime();
  const end = new Date(endUTC).getTime();
  return cachedSlots.some((s) => new Date(s.startUTC).getTime() === start && new Date(s.endUTC).getTime() === end);
}
