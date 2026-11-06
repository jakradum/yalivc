// Who counts as Yali staff, in one place.
//
// isYaliStaff: Yali and Florintree addresses. Sees internal (not yet published)
//   LP reports, always passes the portal and data room sign-in checks.
// canBuildReports: staff plus one named builder account. May generate report
//   PDFs and snapshots.
//
// Session cookies always carry a lowercased email (every sign-in path lowercases
// before signing), so comparing in lowercase changes nothing for real sessions.
const STAFF_DOMAINS = ['@yali.vc', '@florintree.com'];
const REPORT_BUILDERS = ['pranavkarnad@gmail.com'];

export function isYaliStaff(email) {
  if (!email || typeof email !== 'string') return false;
  const lower = email.toLowerCase();
  return STAFF_DOMAINS.some((d) => lower.endsWith(d));
}

export function canBuildReports(email) {
  if (!email || typeof email !== 'string') return false;
  return isYaliStaff(email) || REPORT_BUILDERS.includes(email.toLowerCase());
}
