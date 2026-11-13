import { readFileSync } from 'fs';
import { join } from 'path';
import { YALI_HEAD_INJECT, YALI_NAV_HTML, crumbsHtml, YALI_ADMIN_PDF_SCRIPT } from '../yali-override.js'; // v2

export function GET() {
  let html = readFileSync(join(process.cwd(), 'src/app/(team)/team/_apps/dashboard.html'), 'utf-8');
  html = html.replace('</head>', `${YALI_HEAD_INJECT}\n</head>`);
  const trail = [['Team', '/team/'], ['Admin dashboard']];
  html = html.replace(/<body([^>]*)>/, `<body$1>\n${YALI_NAV_HTML}\n${crumbsHtml(trail)}`);
  html = html.replace('</body>', `${crumbsHtml(trail, 'bottom')}\n</body>`);
  html = html.replace('</body>', `${YALI_ADMIN_PDF_SCRIPT}\n</body>`);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
