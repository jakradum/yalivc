// /api/cron/supabase-sync body, kept free of Next.js so it can be tested with
// node --test. Pings Supabase first (the free project pauses after 7 days idle),
// then backs up to GitHub if GITHUB_BACKUP_TOKEN is set. A failed backup is
// emailed to Pranav but still answers 200: the ping worked, and cron-job.org
// must not disable the keep-alive job over a backup problem.
// → { status, body }; a failed ping throws (the route answers 500).
export async function keepAliveAndBackup({ env = process.env, keepAlive, runBackup, notifyFailure, log = console }) {
  const ping = await keepAlive();
  if (!env.GITHUB_BACKUP_TOKEN) return { status: 200, body: { ok: true, ...ping, backup: 'not configured' } };
  try {
    const backup = await runBackup({ target: 'github', env });
    return { status: 200, body: { ok: true, ...ping, backup } };
  } catch (err) {
    log.error('[github-backup]', err.message);
    const emailed = await notifyFailure(err.message, { env, target: 'github' }).catch(() => false);
    return { status: 200, body: { ok: true, ...ping, backup: { ok: false, error: 'Backup failed; see logs.', emailed } } };
  }
}
