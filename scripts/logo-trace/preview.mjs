// Live preview of the AmiT rebuild: rebuilds the variants below with rebuild_amit.py whenever it changes and
// reloads the open tab. /edit is a pen tool for the swoosh (saves swoosh.json, which the rebuild then uses).
// usage: node preview.mjs  ->  http://localhost:4852
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const PY = path.join(process.env.HOME, '.venvs/trace/bin/python');
const VARIANTS = [ // label, env
  ['Rebuild', {}],
];
const b64 = (f) => fs.readFileSync(f).toString('base64');
let page = '';
function build() {
  try {
    const out = VARIANTS.map(([label, env], k) => {
      const f = path.join(HERE, `.preview-${k}.svg`);
      execFileSync(PY, ['-I', 'rebuild_amit.py', f], { cwd: HERE, env: { ...process.env, ...env }, stdio: 'ignore' });
      return [label, 'data:image/svg+xml;base64,' + b64(f)];
    });
    const orig = 'data:image/png;base64,' + b64(path.join(HERE, 'src/amit-0.png'));
    // each tile: the original's m (left) beside the candidate's (right), both cropped to the m's box in original px
    const [cx, cy, cw, ch] = [17, 10, 70, 28];
    const crop = (img, pix) => `<div class="win"><img src="${img}" class="${pix ? 'pix' : ''}" style="width:${10600 / cw}%;left:${-100 * cx / cw}%;top:${-100 * cy / ch}%"></div>`;
    const cell = (img, cap) => `<div class="cell"><div class="pair">${crop(orig, true)}${crop(img)}</div><span>${cap}</span></div>`;
    const whole = (img, cap) => `<div class="cell"><div class="pair"><img src="${orig}" class="pix"><img src="${img}"></div><span>Original (left), ${cap}</span></div>`;
    page = `<!doctype html><html><head><meta charset="utf-8"><title>AmiT logo</title><style>
body{margin:0;padding:28px 36px;font-family:Inter,Arial,sans-serif;color:#363636;background:#eeeceb}
h1{font:400 21px 'JetBrains Mono',monospace;margin:0 0 6px}p{font-size:12.5px;color:#6b6b6b;margin:0 0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:12px}
.cell{background:#fff;border:1px solid #363636;padding:22px;display:flex;flex-direction:column;align-items:center;gap:10px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}.win{position:relative;aspect-ratio:70/28;overflow:hidden}.win img{position:absolute;max-width:none}.pair>img{width:100%}.grid.one{grid-template-columns:1fr;max-width:1100px}.pix{image-rendering:pixelated}.cell span{font:400 11px 'JetBrains Mono',monospace;color:#6b6b6b}
</style></head><body><h1>AmiT logo</h1><p>A, m and T in Arial Black (m slanted), boxes fitted to the original's pixels; i in Times New Roman Bold Italic.</p>
<div class="grid one">${out.map(([l, s]) => whole(s, l)).join('')}${out.map(([l, s]) => cell(s, 'Letters close up: original (left), rebuild (right)')).join('')}</div>
<script>new EventSource('/events').onmessage=()=>location.reload()</script></body></html>`;
    console.log(new Date().toLocaleTimeString(), 'rebuilt');
    for (const c of clients) c.write('data: reload\n\n');
  } catch (e) { console.error(String(e.stderr || e)); }
}
const clients = new Set();
let t;
fs.watch(HERE, (_, f) => { if (f === 'rebuild_amit.py' || f === 'preview.mjs' || f === 'swoosh.json' || f === 'boxes.json') { clearTimeout(t); t = setTimeout(build, 200); } });
build();
http.createServer((req, res) => {
  if (req.url === '/events') { res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }); res.write(': hi\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return; }
  const send = (type, body) => { res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/edit') return send('text/html; charset=utf-8', fs.readFileSync(path.join(HERE, 'edit.html')));
  if (u.pathname === '/orig.png') return send('image/png', fs.readFileSync(path.join(HERE, 'src/amit-0.png')));
  // the rebuild's letters (everything after the swoosh path), for the editor to draw on top
  if (u.pathname === '/letters') return send('image/svg+xml', fs.readFileSync(path.join(HERE, '.preview-0.svg'), 'utf8').replace(/<path[^>]*\/>/, ''));
  if (u.pathname === '/swoosh' && req.method === 'POST') {
    let b = ''; req.on('data', d => (b += d));
    req.on('end', () => { JSON.parse(b); fs.writeFileSync(path.join(HERE, 'swoosh.json'), b); send('application/json', '{"ok":true}'); });
    return;
  }
  if (u.pathname === '/swoosh') {
    const f = !u.searchParams.has('fit') && fs.existsSync(path.join(HERE, 'swoosh.json')) ? 'swoosh.json' : 'swoosh-fit.json';
    return send('application/json', fs.readFileSync(path.join(HERE, f)));
  }
  send('text/html; charset=utf-8', page);
}).listen(4852, '127.0.0.1', () => console.log('AmiT preview on http://localhost:4852'));
