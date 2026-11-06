// Which system owns writes for a document type, in supabase mode.
//
// `sync_types` (Supabase) says whether the twin sync still copies a type from Sanity:
//   enabled = true, or no row  → Sanity is the source (Studio edits it, the sync
//                                 carries changes across): write to Sanity.
//   enabled = false            → Supabase owns the type: write to sanity_docs.
// Writing to sanity_docs while the sync is still on would be undone (patches) or
// deleted (new docs) by the next sync run, so Sanity is also the fallback when
// sync_types cannot be read.
import { supa } from './rest.js';

const TTL_MS = 30 * 1000;
let cache = null; // { at, disabled: Set<type> }

async function disabledTypes() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.disabled;
  const { rows } = await supa('/rest/v1/sync_types?select=type,enabled');
  const disabled = new Set((rows || []).filter((r) => r.enabled === false).map((r) => r.type));
  cache = { at: Date.now(), disabled };
  return disabled;
}

// 'sanity' or 'supabase'
export async function writeOwner(type) {
  try {
    return (await disabledTypes()).has(type) ? 'supabase' : 'sanity';
  } catch (err) {
    console.warn(`[lp-data] sync_types unavailable (${err?.status || 'error'}); writing ${type} to Sanity`);
    return 'sanity';
  }
}

export function resetWriteOwnerCache() {
  cache = null;
}

// A write that goes to Sanity in sanity and shadow mode, and in supabase mode to
// whichever system owns `type` right now.
export function makeWrite(name, type, sanityFn, supabaseFn, getSource) {
  const fn = async (...args) => {
    if (getSource() !== 'supabase') return sanityFn(...args);
    return (await writeOwner(type)) === 'supabase' ? supabaseFn(...args) : sanityFn(...args);
  };
  Object.defineProperty(fn, 'name', { value: name });
  return fn;
}
