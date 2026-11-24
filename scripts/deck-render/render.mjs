// Static render of a deck to one HTML file (all slides), straight from src/decks, no Next server.
// usage (from the repo root): node scripts/deck-render/render.mjs <deckId> <dataJson> <outHtml>
// For fund-ii, make the data with fund2-data.mjs first (fixture + Sanity photo and logo URLs).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const nodeRequire = createRequire(process.cwd() + '/package.json');
const babel = nodeRequire('@babel/core');
const cache = {};
function load(p) {
  let abs = p.startsWith('@/') ? './src/' + p.slice(2) : p;
  if (!/\.(js|json|css)$/.test(abs)) abs += '.js';
  if (cache[abs]) return cache[abs];
  if (abs.endsWith('.css')) return {};
  if (abs.endsWith('.json')) return (cache[abs] = { default: JSON.parse(fs.readFileSync(abs, 'utf8')), __esModule: true });
  const src = fs.readFileSync(abs, 'utf8').replace(/^['"]use client['"];?/m, '').replace(/^import 'server-only';?\s*$/m, '');
  const { code } = babel.transformSync(src, { presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-react'], filename: abs, cwd: process.cwd() });
  const mod = { exports: {} }; cache[abs] = mod.exports;
  const req = (q) => (q.startsWith('@/') || q.startsWith('.')) ? load(q.startsWith('@/') ? q : path.join(path.dirname(abs), q)) : nodeRequire(q);
  new Function('module', 'exports', 'require', 'React', code)(mod, mod.exports, req, nodeRequire('react'));
  return (cache[abs] = mod.exports);
}
const [deckId, dataPath, out] = process.argv.slice(2);
const R = nodeRequire('react'), RDS = nodeRequire('react-dom/server');
const { DeckRenderer } = load('./src/decks/core/DeckRenderer.js');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let html = RDS.renderToStaticMarkup(R.createElement('div', { className: 'deck-root' }, R.createElement(DeckRenderer, { deckId, data })));
const pub = 'file://' + process.cwd() + '/public/';
const embed = (f, mime) => `data:${mime};base64,${fs.readFileSync('./public/' + f).toString('base64')}`;
html = html.split('src="/favicon.svg"').join(`src="${embed('favicon.svg','image/svg+xml')}"`).split('src="/yali-logo.png"').join(`src="${embed('yali-logo.png','image/png')}"`);
html = html.replace(/(src|href)="\/(?!\/)/g, `$1="${pub}`);
const fonts = fs.readFileSync('./src/decks/design-system/fonts.css','utf8').replaceAll("url('/fonts/", `url('${pub}fonts/`);
const tokens = fs.readFileSync('./src/decks/design-system/tokens.css','utf8');
fs.writeFileSync(out, `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${load('./src/decks/core/deckVersion.js').deckDocTitle(deckId, data)}</title><style>${fonts}${tokens}
@page { size: 960px 540px; margin: 0; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } body { margin: 0; } .deck-slide { break-inside: avoid; }</style></head><body>${html}</body></html>`);
console.log('ok');
