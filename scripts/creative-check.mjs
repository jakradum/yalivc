// Guardrail tests for the creative schema — plain Node, no framework:
//   node scripts/creative-check.mjs
import { FIXTURES } from '../src/creative/fixtures/index.js';
import { validateAsset } from '../src/creative/validate.js';
import { applyOp, newAsset, systemPrompt } from '../src/creative/engine.js';
import { compileEmail } from '../src/creative/email/compile.js';
import { cleanLibrary } from '../src/creative/library.js';

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log(`  FAIL ${name} ${extra}`);
  }
};
const clone = (o) => structuredClone(o);
const rejects = (name, doc, expect) => {
  const r = validateAsset(doc);
  const hit = !r.ok && r.errors.some((e) => (e.path + e.msg).toLowerCase().includes(expect.toLowerCase()));
  ok(name, hit, `(expected error containing "${expect}", got: ${r.ok ? 'VALID' : r.errors.map((e) => e.msg).join(' | ')})`);
};
const find = (b, id) => (b.id === id ? b : (b.children || []).map((c) => find(c, id)).find(Boolean));
const rootOf = (d, p = 0) => d.pages[p].root;

console.log('Fixtures');
for (const [k, doc] of Object.entries(FIXTURES)) {
  const r = validateAsset(doc);
  ok(`${k} is valid`, r.ok, r.errors.map((e) => `${e.path}: ${e.msg}`).join('; '));
  console.log(`  ${k}: ${r.ok ? 'valid' : 'INVALID'}, ${r.warnings.length} warning(s)`);
}

console.log('Guardrails reject…');
{
  const d = clone(FIXTURES.carousel); find(rootOf(d, 1), 'size-eyebrow').color = 'hotpink';
  rejects('free colour', d, 'not a brand colour');
  const d2 = clone(FIXTURES.carousel); find(rootOf(d2, 1), 'size-body').fontSize = 12;
  rejects('font size prop', d2, 'not a prop');
  const d3 = clone(FIXTURES.carousel); find(rootOf(d3, 0), 'cover-title').text = 'x'.repeat(200);
  rejects('over-long display text', d3, 'too long');
  const d4 = clone(FIXTURES.carousel); find(rootOf(d4, 2), 'sectors-title').color = 'gold';
  rejects('gold on white contrast', d4, 'contrast');
  const d5 = clone(FIXTURES.carousel); find(rootOf(d5, 4), 'cta-btn').href = 'http://yali.vc';
  rejects('http link', d5, 'https');
  const d6 = clone(FIXTURES.carousel); find(rootOf(d6, 4), 'cta-btn').href = 'https://evil.example/x';
  rejects('link host not allowed', d6, 'not allowed');
  const d7 = clone(FIXTURES.carousel); find(rootOf(d7, 1), 'size-stat').source = undefined;
  rejects('stat without source', d7, 'required');
  const d8 = clone(FIXTURES.carousel); find(rootOf(d8, 1), 'size-stat').source = 'somewhere else';
  rejects('stat with bad source', d8, 'provenance');
  const d9 = clone(FIXTURES.carousel); rootOf(d9, 1).children.push({ type: 'image', id: 'i1', src: { kind: 'sanity', url: 'https://evil.example/a.png' }, alt: 'x' });
  rejects('image from outside source', d9, 'image must be');
  const d10 = clone(FIXTURES.carousel); rootOf(d10, 1).children.push({ type: 'image', id: 'i2', src: { kind: 'library', key: 'mark' } });
  rejects('image without alt', d10, 'alt');
  const d11 = clone(FIXTURES.emailer); rootOf(d11).children.push({ type: 'layer', id: 'l1', children: [] });
  rejects('layer in email', d11, 'not available');
  const d12 = clone(FIXTURES.carousel); while (d12.pages.length < 21) d12.pages.push({ ...clone(d12.pages[1]), id: `x${d12.pages.length}`, root: { ...clone(d12.pages[1].root), id: `xr${d12.pages.length}`, children: [] } });
  rejects('too many pages', d12, 'page(s)');
  const d13 = clone(FIXTURES.carousel); find(rootOf(d13, 1), 'size-rule').id = 'size-stat';
  rejects('duplicate id', d13, 'duplicate');
  const d14 = clone(FIXTURES.carousel); find(rootOf(d14, 0), 'cover-bar').style = { left: 12 };
  rejects('free style object', d14, 'not a prop');
  const d15 = clone(FIXTURES.carousel); d15.pages[1].background = '#ffffff';
  rejects('hex page background', d15, 'brand colour');
  const d16 = clone(FIXTURES.emailer); find(rootOf(d16), 'mail-stats').columns = 3;
  rejects('email 3 columns', d16, 'at most 2');
  const d17 = clone(FIXTURES.emailer); find(rootOf(d17), 'mail-logo').variant = 'mark';
  rejects('email svg mark', d17, 'lockup');
}

{
  const d = clone(FIXTURES.carousel);
  rootOf(d, 1).children.push({ type: 'stat', id: 'perf', value: '5x', label: 'Returned to investors', source: 'user', color: 'crimson' });
  const r = validateAsset(d);
  ok('user-sourced return figure is allowed but flagged', r.ok && r.warnings.some((w) => w.msg.includes('performance/return')));
}

{
  // gen1's failure: 'Manufacturing' at heading size in a narrow cell (3 columns here; the
  // real one was 2 columns inside a padded card)
  const d = clone(FIXTURES.carousel);
  d.pages[2].root.children.push({ type: 'grid', id: 'gg', columns: 3, gap: 'm', children: [{ type: 'text', id: 't1', role: 'heading', text: 'Smart Manufacturing', color: 'ink' }, { type: 'text', id: 't2', role: 'heading', text: 'Fabless Semiconductor', color: 'ink' }] });
  rejects('long word in a narrow grid cell', d, 'cell is');
  const ok2 = clone(FIXTURES.carousel);
  ok2.pages[2].root.children.push({ type: 'grid', id: 'gg', columns: 3, gap: 'm', children: [{ type: 'text', id: 't1', role: 'body', text: 'Smart Manufacturing', color: 'ink' }, { type: 'text', id: 't2', role: 'body', text: 'Fabless Semiconductor', color: 'ink' }] });
  ok('same words at body size fit', validateAsset(ok2).ok);
}


console.log('Uploaded assets…');
{
  const P = 'https://cdn.sanity.io/images/nt0wmty3/production/';
  const lib = () => ({
    'image-photo-1600x1067-jpg': { url: `${P}photo-1600x1067.jpg`, width: 1600, height: 1067, kind: 'photo', alt: 'The team at the tape-out' },
    'image-tall-600x1800-jpg': { url: `${P}tall-600x1800.jpg`, width: 600, height: 1800, kind: 'photo', alt: 'A tall photo' },
    'image-nocrop-1200x800-png': { url: `${P}nocrop-1200x800.png`, width: 1200, height: 800, kind: 'graphic', alt: 'A diagram', noCrop: true },
    'image-logo-800x300-png': { url: `${P}logo-800x300.png`, width: 800, height: 300, kind: 'logo', alt: 'Partner logo', ground: 'light' },
  });
  const img = (id, extra = {}) => ({ type: 'image', id: `im-${Math.random().toString(36).slice(2, 6)}`, src: { kind: 'upload', id }, ...extra });
  const withImg = (block, bg) => {
    const d = clone(FIXTURES.carousel);
    d.assets = lib();
    if (bg) d.pages[2].background = bg;
    d.pages[2].root.children = [block]; // a clean page: a full-width photo fills most of a 1:1 card
    return d;
  };
  ok('uploaded photo at a near-natural ratio is valid', validateAsset(withImg(img('image-photo-1600x1067-jpg', { ratio: '3:2' }))).ok);
  ok('alt text comes from the asset (no alt needed)', validateAsset(withImg(img('image-photo-1600x1067-jpg'))).ok);
  rejects('unknown uploaded asset id', withImg(img('image-nope')), 'no uploaded asset');
  rejects('logo with fit cover', withImg(img('image-logo-800x300-png', { fit: 'cover' })), 'never cropped');
  rejects('logo recoloured to grayscale', withImg(img('image-logo-800x300-png', { fit: 'contain', tone: 'grayscale' })), 'recoloured');
  rejects('light-ground logo on crimson', withImg(img('image-logo-800x300-png', { fit: 'contain' }), 'crimson'), 'light grounds');
  ok('light-ground logo on white is valid', validateAsset(withImg(img('image-logo-800x300-png', { fit: 'contain' }))).ok);
  rejects('do-not-crop asset with cover', withImg(img('image-nocrop-1200x800-png', { fit: 'cover' })), 'do-not-crop');
  rejects('ratio that cuts away most of the picture', withImg(img('image-tall-600x1800-jpg', { ratio: '16:9' })), 'cut away');
  {
    const d = withImg({ type: 'layer', id: 'lay', ratio: '1:1', children: [img('image-photo-1600x1067-jpg', { anchor: 'fill' }), { type: 'text', id: 'lt', anchor: 'bottom', role: 'heading', text: 'Hello', color: 'white' }] });
    rejects('text over an uploaded photo without a scrim', d, 'scrim');
    const d2 = withImg({ type: 'layer', id: 'lay', ratio: '1:1', children: [img('image-photo-1600x1067-jpg', { anchor: 'fill' }), { type: 'shape', id: 'sc', kind: 'scrim', color: 'ink', opacity: 0.7, anchor: 'fill' }, { type: 'text', id: 'lt', anchor: 'bottom', role: 'heading', text: 'Hello', color: 'white' }] });
    const r = validateAsset(d2);
    ok('…with a scrim it is valid', r.ok, r.errors.map((e) => e.msg).join('|'));
  }
  {
    const d = withImg(img('image-photo-1600x1067-jpg'));
    d.assets['image-photo-1600x1067-jpg'].url = 'https://evil.example/a.jpg';
    rejects('asset URL outside Sanity', d, 'Sanity asset URL');
    const d2 = withImg(img('image-photo-1600x1067-jpg'));
    d2.assets['image-photo-1600x1067-jpg'].alt = '';
    rejects('asset without alt text', d2, 'alt');
  }
  const cleaned = cleanLibrary({ ...lib(), bad: { url: 'https://evil.example/x.png', width: 1, height: 1, kind: 'photo', alt: 'x' }, 'image-extra-100x100-png': { ...lib()['image-photo-1600x1067-jpg'], onclick: 'x' } }, P);
  ok('cleanLibrary keeps good entries, drops bad URLs', Object.keys(cleaned).length === 5 && !cleaned.bad);
  ok('cleanLibrary strips unknown fields', !('onclick' in (cleaned['image-photo-1600x1067-jpg'] || {})));
  const doc = newAsset({ format: 'linkedin-square' });
  doc.assets = lib();
  const prompt = systemPrompt(doc);
  ok('prompt lists uploaded assets and how to use them', prompt.includes('UPLOADED ASSETS') && prompt.includes('HOW TO USE THEM') && prompt.includes('natural ratio'));
  ok('prompt says none when empty', systemPrompt(newAsset({ format: 'email' })).includes('UPLOADED ASSETS: none'));
  const emailDoc = clone(FIXTURES.emailer);
  emailDoc.assets = lib();
  emailDoc.pages[0].root.children.splice(2, 0, img('image-photo-1600x1067-jpg', { ratio: '3:2' }));
  ok('email with an uploaded photo compiles with its alt', compileEmail(emailDoc).includes('alt="The team at the tape-out"'));
}

console.log('House rules (from the past assets)…');
{
  const d = clone(FIXTURES.carousel);
  find(rootOf(d, 1), 'size-body').text = 'Term of ten years — with two extensions.';
  rejects('em dash in visible text', d, 'em dash');
  const e = clone(FIXTURES.emailer);
  find(rootOf(e), 'mail-title').text = 'A deep tech fund — for India';
  rejects('em dash in an email headline', e, 'em dash');
  const ok3 = clone(FIXTURES.carousel);
  find(rootOf(ok3, 1), 'size-body').text = 'Term of ten years: with two extensions.';
  ok('a colon instead is fine', validateAsset(ok3).ok);
  // rounded corners are not in the brand
  const r = clone(FIXTURES.carousel);
  rootOf(r, 1).radius = 's';
  rejects('rounded corner not in the brand', r, 'radius');
  // photo-led pages may run edge to edge; other pages keep the safe margin
  const b = clone(FIXTURES.roundup);
  ok('a bleed photo page is valid', validateAsset(b).ok);
  const nb = clone(FIXTURES.roundup);
  delete nb.pages[1].bleed;
  rejects('the same photo page without bleed overflows its safe area', nb, 'tall');
  ok('a non-boolean bleed is rejected', !validateAsset(Object.assign(clone(FIXTURES.roundup), { pages: [{ ...clone(FIXTURES.roundup).pages[0], bleed: 'yes' }] })).ok);
  // logos: xl closing mark, tags, fades all exist
  ok('house samples use tag, fade, band and the xl logomark', ['news', 'spotlight', 'roundup'].every((k) => validateAsset(FIXTURES[k]).ok));
  const tag = clone(FIXTURES.carousel);
  rootOf(tag, 2).children.push({ type: 'tag', id: 'tg', label: 'In-house IP', style: 'outline', color: 'crimson' });
  ok('an outline tag is valid', validateAsset(tag).ok);
  const fade = clone(FIXTURES.carousel);
  rootOf(fade, 2).children.push({ type: 'shape', id: 'fd', kind: 'fade', color: 'black' });
  rejects('a fade outside a layer', fade, 'inside a layer');
}

console.log('Company logos and anchors…');
{
  const P = 'https://cdn.sanity.io/images/nt0wmty3/production/';
  const logo = { url: `${P}logo-1920x1080.png`, width: 1920, height: 1080, kind: 'logo', alt: 'Acme logo', noCrop: true, ground: 'light' };
  const d = clone(FIXTURES.news);
  d.assets = { 'image-logo-1920x1080-png': logo };
  // the company logo sits in the chip as a small fixed-height picture, not a full-width block
  const chip = find(rootOf(d), 'n1-chip');
  chip.children = [{ type: 'image', id: 'co', src: { kind: 'upload', id: 'image-logo-1920x1080-png' }, fit: 'contain', size: 's' }];
  const r = validateAsset(d);
  ok('an uploaded logo defaults to a small size and the page still fits', r.ok, r.errors.map((e) => e.msg).join(' | '));
  const big = clone(d);
  find(rootOf(big), 'co').size = 'fill';
  rejects('the same logo forced full width overflows', big, 'tall');
  // natural spellings of an anchor are accepted, not rejected
  const doc = newAsset({ format: 'linkedin-square' });
  const a = applyOp(doc, 'add_block', { parent: 'page-1-root', block: { type: 'layer', ratio: '1:1', children: [{ type: 'logo', variant: 'mark', tone: 'light', anchor: 'top-left', inset: 'm' }] } });
  ok('"top-left" is understood as tl', a.doc.pages[0].root.children[0].children[0].anchor === 'tl');
  const b2 = applyOp(a.doc, 'update_block', { id: a.doc.pages[0].root.children[0].children[0].id, props: { anchor: 'Bottom-Right' } });
  ok('anchor aliases work in updates too', b2.doc.pages[0].root.children[0].children[0].anchor === 'br');
  ok('the prompt tells the model about its fact tools', systemPrompt(doc).includes('lookup_company') && systemPrompt(doc).includes('attach_company_logo') && systemPrompt(doc).includes('LP-confidential') === false && systemPrompt(doc).includes('Confidentiality'));
}

console.log('Page height…');
{
  const many = clone(FIXTURES.carousel);
  many.pages[2].root.children = Array.from({ length: 14 }, (_, i) => ({ type: 'text', id: `m${i}`, role: 'body', text: 'A sentence that takes a line or two of body text on this card.', color: 'ink' }));
  rejects('content taller than the page', many, 'tall');
  const fewer = clone(FIXTURES.carousel);
  fewer.pages[2].root.children = many.pages[2].root.children.slice(0, 4);
  ok('the same page with fewer blocks fits', validateAsset(fewer).ok);
  const email = clone(FIXTURES.emailer);
  for (let i = 0; i < 20; i += 1) email.pages[0].root.children.push({ type: 'text', id: `e${i}`, role: 'body', text: 'Emails scroll, so length is not a page overflow.', color: 'ink' });
  ok('email may grow beyond a screen', validateAsset(email).ok);
  // an op that would overflow is rejected and leaves the asset alone
  let threw = false;
  const before = JSON.stringify(fewer);
  try { applyOp(fewer, 'add_block', { parent: 'cover-root', block: { type: 'spacer', size: 'xxl' } }); applyOp(fewer, 'set_page', { id: 'sectors', root: many.pages[2].root }); } catch { threw = true; }
  ok('overflowing set_page is rejected', threw && JSON.stringify(fewer) === before);
}

console.log('Engine…');
{
  const doc = newAsset({ format: 'linkedin-square', title: 't' });
  const a = applyOp(doc, 'add_block', { parent: 'page-1-root', block: { type: 'text', role: 'heading', text: 'Hello', color: 'ink' } });
  ok('valid op applies', a.doc.pages[0].root.children.length === 1);
  ok('input not mutated', doc.pages[0].root.children.length === 0);
  let threw = false;
  try { applyOp(a.doc, 'add_block', { parent: 'page-1-root', block: { type: 'text', role: 'heading', text: 'x', color: 'white' } }); } catch { threw = true; }
  ok('invalid op rejected (white on white)', threw);
  threw = false;
  try { applyOp(a.doc, 'update_block', { id: a.doc.pages[0].root.children[0].id, props: { color: 'gold' } }); } catch { threw = true; }
  ok('contrast-breaking update rejected', threw);
  const b = applyOp(a.doc, 'set_page', { id: 'page-1', background: 'crimson', root: { type: 'stack', direction: 'column', gap: 'm', children: [{ type: 'text', role: 'display', text: 'Hi', color: 'white' }] } });
  ok('set_page rebuilds with auto ids', b.doc.pages[0].root.children[0].id && b.doc.pages[0].root.id);
  ok('system prompt renders', systemPrompt(b.doc).includes('BRAND TOKENS'));
}

console.log('Email compile…');
{
  const html = compileEmail(FIXTURES.emailer, { baseUrl: 'https://example.test' });
  ok('is table-based', html.includes('role="presentation"') && !html.includes('<div'));
  ok('600px wide', html.includes('width="600"'));
  ok('inline styled, no <style>/<script>', !html.includes('<style') && !html.includes('<script'));
  ok('contains CTA link', html.includes('href="https://yali.vc"'));
  {
    const d = clone(FIXTURES.emailer);
    find(rootOf(d), 'mail-foot').text = 'Yali Capital | yali.vc';
    ok('a literal pipe is not a highlight marker', !compileEmail(d).includes('background-color:#ebde84;color:#363636;padding:0 3px;">'));
  }
  ok('logo absolute url', html.includes('https://example.test/brand/yali-lockup.png'));
  console.log(`  ${html.length} chars`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
