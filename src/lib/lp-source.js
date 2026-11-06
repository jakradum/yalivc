// Where LP portal and data room data is read from (and written to).
//
//   LP_DATA_SOURCE=sanity    (default, also for unset or unknown values) Sanity, as today
//   LP_DATA_SOURCE=supabase  read and write the Supabase twin (sanity_docs / sanity_files)
//   LP_DATA_SOURCE=shadow    serve Sanity; after the response, run the Supabase version,
//                            compare, and log differences to parity_diffs. Writes: Sanity only.
//
// Server-only. Read on every call so a changed env var takes effect without a rebuild
// of this module (Vercel still needs a redeploy for env changes).
const SOURCES = new Set(['sanity', 'supabase', 'shadow']);

export function getLpSource() {
  const raw = (process.env.LP_DATA_SOURCE || '').trim().toLowerCase();
  return SOURCES.has(raw) ? raw : 'sanity';
}
