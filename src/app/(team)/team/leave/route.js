import { readFileSync } from 'fs';
import { join } from 'path';
import { cookies } from 'next/headers';
import { TEAM_COOKIE, verifyTeamSession } from '@/lib/teamSession';
import { allowedNamesFor } from '@/lib/leaveEmail/directory';
import { YALI_HEAD_INJECT, YALI_NAV_HTML, crumbsHtml, LEAVE_SKELETON_SCRIPT } from '../yali-override.js'; // v2

export const dynamic = 'force-dynamic';

export async function GET() {
  // The proxy only lets signed-in Yali accounts this far. The form shows just the
  // names this person may log for: their own, or everyone for LOGS_FOR_OTHERS.
  const email = verifyTeamSession((await cookies()).get(TEAM_COOKIE)?.value);
  const me = JSON.stringify({ email, names: allowedNamesFor(email) }).replace(/</g, '\\u003c');
  let html = readFileSync(join(process.cwd(), 'src/app/(team)/team/_apps/request-form.html'), 'utf-8');
  html = html.replace('</head>', `<script>window.__TEAM_ME = ${me};</script>\n${YALI_HEAD_INJECT}\n</head>`);
  const trail = [['Team', '/team/'], ['Leave & WFH']];
  html = html.replace(/<body([^>]*)>/, `<body$1>\n${YALI_NAV_HTML}\n${crumbsHtml(trail)}`);
  html = html.replace('</body>', `${crumbsHtml(trail, 'bottom')}\n</body>`);
  html = html.replace('</body>', `${LEAVE_SKELETON_SCRIPT}\n</body>`);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
