// The pitch scheduler's Microsoft Graph refresh token (Pranav's delegated calendar
// grant), kept in Supabase `ms_graph_tokens` under purpose 'pitch-calendar', next to
// the OneDrive backup's token (supabase/migrations/0003_ms_graph_tokens.sql). Moved
// out of the Sanity singleton pitchSchedulerCalendarAuth on 24 Nov 2026. Never
// exported by the backups. Server-side only.
import { supa } from './lp-data/rest.js';

const PURPOSE = 'pitch-calendar';

export async function readCalendarToken() {
  const { rows } = await supa(`/rest/v1/ms_graph_tokens?select=refresh_token&purpose=eq.${PURPOSE}`);
  return rows?.[0]?.refresh_token || null;
}

// `scope` records who connected it (the callback passes the Microsoft account).
export async function saveCalendarToken(refreshToken, scope) {
  await supa('/rest/v1/ms_graph_tokens?on_conflict=purpose', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { purpose: PURPOSE, refresh_token: refreshToken, ...(scope ? { scope } : {}), updated_at: new Date().toISOString() },
  });
}
