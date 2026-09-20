// Guardrail tests for the creative schema — plain Node, no framework:
//   node scripts/creative-check.mjs
import { FIXTURES } from '../src/creative/fixtures/index.js';
import { validateAsset } from '../src/creative/validate.js';
import { applyOp, newAsset, systemPrompt } from '../src/creative/engine.js';
import { compileEmail } from '../src/creative/email/compile.js';

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
  ok('logo absolute url', html.includes('https://example.test/brand/yali-lockup.png'));
  console.log(`  ${html.length} chars`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
