import { readFileSync } from 'fs';
import { join } from 'path';

const NAV_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  .yali-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 99999; background: #830d35; height: 52px; display: flex; align-items: center; padding: 0 28px; gap: 14px; border-bottom: 1px solid rgba(0,0,0,0.15); box-sizing: border-box; }
  .yali-nav .yn-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(235,222,132,0.8); flex-shrink: 0; }
  .yali-nav .yn-sep { width: 1px; height: 16px; background: rgba(239,239,239,0.2); flex-shrink: 0; }
  .yali-nav .yn-title { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 400; color: #efefef; text-decoration: none; }
  .yali-nav .yn-title:hover { color: #ebde84; }
  body { padding-top: 52px !important; margin-top: 0 !important; }
</style>`;

const NAV_BAR = `<nav class="yali-nav">
  <span class="yn-label">Yali Capital</span>
  <span class="yn-sep"></span>
  <a href="/team/" class="yn-title">Team Portal</a>
</nav>`;

export function GET() {
  let html = readFileSync(join(process.cwd(), 'public/team-apps/dashboard.html'), 'utf-8');
  html = html.replace('</head>', `${NAV_HEAD}\n</head>`);
  html = html.replace(/<body([^>]*)>/, `<body$1>\n${NAV_BAR}`);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
