// Shared read access to the pitchSchedulerSlotCache singleton, refreshed on
// a schedule by /api/cron/pitch-scheduler-refresh-slots. Used both at
// invitation-generation time and by the founder-facing routes, which
// intersect an invitation's originally-offered slots against this cache's
// current contents so a deleted placeholder disappears from what a founder
// sees without anyone patching the invitation by hand.

import { createClient } from '@sanity/client';

const CACHE_DOC_ID = 'pitchSchedulerSlotCache';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

// Returns [{startUTC, endUTC}, ...] from the cache, or null if it's never
// been populated (cron hasn't run yet, or Graph was unreachable on every
// attempt so far).
export async function getCachedSlots() {
  const doc = await client.fetch(`*[_id == $id][0]{slots}`, { id: CACHE_DOC_ID }).catch((err) => {
    console.error('Failed to read slot cache:', err);
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
