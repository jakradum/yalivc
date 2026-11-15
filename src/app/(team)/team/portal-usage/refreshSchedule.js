// How often the portal usage page re-reads Supabase, by how long ago the latest LP
// report came out. Reports come out on the 44th day after a quarter ends (13 Aug,
// 13 Nov, 13 Feb, 14 May), when LPs are most active:
//   first 2 days: every 10 min; to day 7: every 20 min; to day 21: every 30 min;
//   after that, twice a day until the next report.
const DAY = 86400000;
const MIN = 60000;
const RELEASE_AFTER_DAYS = 44;
const STEPS = [[2 * DAY, 10 * MIN], [7 * DAY, 20 * MIN], [21 * DAY, 30 * MIN]];
const QUIET = 12 * 60 * MIN;

// Quarter ends (31 Mar, 30 Jun, 30 Sep, 31 Dec) as local midnights; month is 0-based.
const quarterEnds = (year) => [[year, 2, 31], [year, 5, 30], [year, 8, 30], [year, 11, 31]].map(([y, m, d]) => new Date(y, m, d));

export function latestRelease(now = Date.now()) {
  const year = new Date(now).getFullYear();
  const releases = [...quarterEnds(year - 1), ...quarterEnds(year)]
    .map((end) => end.getTime() + RELEASE_AFTER_DAYS * DAY)
    .filter((t) => t <= now);
  return Math.max(...releases);
}

export function refreshEvery(now = Date.now()) {
  const age = now - latestRelease(now);
  return STEPS.find(([upTo]) => age < upTo)?.[1] ?? QUIET;
}

export function refreshLabel(now = Date.now()) {
  const every = refreshEvery(now);
  return every === QUIET ? 'Refreshes twice a day' : `Refreshes every ${every / MIN} min`;
}
