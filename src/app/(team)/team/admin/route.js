import { readFileSync } from 'fs';
import { join } from 'path';
import { YALI_HEAD_INJECT, YALI_NAV_HTML, YALI_ADMIN_PDF_SCRIPT } from '../yali-override.js';

export function GET() {
  let html = readFileSync(join(process.cwd(), 'public/team-apps/dashboard.html'), 'utf-8');
  html = html.replace('</head>', `${YALI_HEAD_INJECT}\n</head>`);
  html = html.replace(/<body([^>]*)>/, `<body$1>\n${YALI_NAV_HTML}`);
  html = html.replace('</body>', `${YALI_ADMIN_PDF_SCRIPT}\n</body>`);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
