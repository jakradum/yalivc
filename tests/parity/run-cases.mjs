// Runs the recorded parity cases (tests/parity/expected/*.json) against an implementation.
//
//   node tests/parity/run-cases.mjs --impl <module path> [options]
//
// The module must export setDocLoader(loader) (contract: loader = { byType, byIds }) and the
// functions named in the expected files. LP_DATA_SOURCE is set to `supabase` before import.
//
// Options
//   --impl <path>          module to test (required)
//   --alias ours=theirs    call `theirs` for the answer key's function `ours` (repeatable;
//                          the inline route lookups carry this answer key's own names)
//   --only <fn[,fn]>       run only these functions
//   --scenario <name>      run only this fixture scenario
//   --allow-missing        a function the module does not export is skipped, not a failure
//   --strict-prefix        a file URL with the wrong prefix (/partners vs /dataroom vs CDN) fails
//   --max-diffs <n>        differences printed per failing case (default 3), cases per function (default 5)
//   --dotenv <path>        load env vars from this file before importing (never printed)
//
// Comparison: deep and order-sensitive for arrays; object key order is ignored; a missing key
// is not equal to null. File URLs `/partners/file/<id>`, `/dataroom/file/<id>` (optional
// `?dl=<name>`) and Sanity CDN file URLs are compared by asset id.
// Exit code: 0 when every case passes, 1 otherwise, 2 on usage errors.
import { readFileSync, readdirSync } from 'node:fs';
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FUNCTIONS } from './queries.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// ---------- args ----------
const args = process.argv.slice(2);
const opt = { alias: {}, maxDiffs: 3, maxCases: 5 };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const val = () => { const v = args[++i]; if (v === undefined) usage(`${a} needs a value`); return v; };
  if (a === '--impl') opt.impl = val();
  else if (a === '--alias') { const [o, t] = val().split('='); if (!o || !t) usage('--alias wants ours=theirs'); opt.alias[o] = t; }
  else if (a === '--only') opt.only = new Set(val().split(','));
  else if (a === '--scenario') opt.scenario = val();
  else if (a === '--allow-missing') opt.allowMissing = true;
  else if (a === '--strict-prefix') opt.strictPrefix = true;
  else if (a === '--max-diffs') { opt.maxDiffs = Number(val()); opt.maxCases = Math.max(opt.maxDiffs, 1); }
  else if (a === '--dotenv') opt.dotenv = val();
  else usage(`unknown argument ${a}`);
}
function usage(msg) {
  console.error(`run-cases: ${msg}\nusage: node tests/parity/run-cases.mjs --impl <path> [--alias ours=theirs] [--only fn] [--scenario s] [--allow-missing] [--strict-prefix] [--max-diffs n] [--dotenv file]`);
  process.exit(2);
}
if (!opt.impl) usage('--impl is required');

// ---------- environment + import ----------
if (opt.dotenv) {
  const { config } = await import('dotenv');
  config({ path: opt.dotenv, quiet: true });
}
process.env.LP_DATA_SOURCE = 'supabase';
register('./alias-hooks.mjs', import.meta.url);
const impl = await import(pathToFileURL(path.resolve(opt.impl)).href);
if (typeof impl.setDocLoader !== 'function') {
  console.error('run-cases: the module does not export setDocLoader(loader)');
  process.exit(1);
}

// ---------- fixtures + loader ----------
const fixtures = {};
const fixture = (s) => (fixtures[s] ??= JSON.parse(readFileSync(path.join(here, 'fixtures', `${s}.json`), 'utf8')));
const clone = (v) => structuredClone(v);
const loaderStats = { byType: 0, byIds: 0 };
function loaderFor(docs) {
  return {
    byType: async (type) => { loaderStats.byType++; return clone(docs.filter((d) => d._type === type)); },
    byIds: async (ids) => {
      loaderStats.byIds++;
      const map = new Map(docs.map((d) => [d._id, d]));
      const seen = new Set();
      const out = [];
      for (const id of ids || []) if (map.has(id) && !seen.has(id)) { seen.add(id); out.push(clone(map.get(id))); }
      return out;
    },
  };
}

// ---------- comparison ----------
const FILE_PATH = /^\/(partners|dataroom)\/file\/([^?#/]+)\/?(\?dl=[^#]*)?$/; // trailing slash allowed (contract, 6 Nov)
const CDN_FILE = /^https:\/\/cdn\.sanity\.io\/files\/nt0wmty3\/production\/([0-9a-f]+)\.([A-Za-z0-9]+)(\?.*)?$/;
function fileUrlInfo(s) {
  if (typeof s !== 'string') return null;
  let m = FILE_PATH.exec(s);
  if (m) return { kind: m[1], id: decodeURIComponent(m[2]) };
  m = CDN_FILE.exec(s);
  if (m) return { kind: 'cdn', id: `file-${m[1]}-${m[2]}` };
  return null;
}
const norm = (s) => { const f = fileUrlInfo(s); return f ? `asset:${f.id}` : s; };
const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
const show = (v) => { const s = v === undefined ? '(missing)' : JSON.stringify(v); return s.length > 160 ? s.slice(0, 157) + '...' : s; };

function diff(exp, act, p, out) {
  if (out.length >= 50) return;
  const te = typeOf(exp), ta = typeOf(act);
  if (te !== ta) { out.push({ path: p, expected: exp, actual: act }); return; }
  if (te === 'array') {
    if (exp.length !== act.length) out.push({ path: `${p}.length`, expected: exp.length, actual: act.length });
    for (let i = 0; i < Math.min(exp.length, act.length); i++) diff(exp[i], act[i], `${p}[${i}]`, out);
    return;
  }
  if (te === 'object') {
    for (const k of Object.keys(exp)) {
      if (!(k in act)) out.push({ path: `${p}.${k}`, expected: exp[k], actual: undefined });
      else diff(exp[k], act[k], `${p}.${k}`, out);
    }
    for (const k of Object.keys(act)) if (!(k in exp)) out.push({ path: `${p}.${k}`, expected: undefined, actual: act[k] });
    return;
  }
  if (te === 'string' ? norm(exp) !== norm(act) : !Object.is(exp, act)) out.push({ path: p, expected: exp, actual: act });
}
function prefixProblems(v, surface, p, out) {
  if (Array.isArray(v)) v.forEach((x, i) => prefixProblems(x, surface, `${p}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) prefixProblems(x, surface, `${p}.${k}`, out);
  else { const f = fileUrlInfo(v); if (f && f.kind !== (surface === 'dataroom' ? 'dataroom' : 'partners')) out.push({ path: p, kind: f.kind }); }
}
const shortInput = (input) => JSON.stringify(input.map((x) => (typeof x === 'string' && x.length > 40 ? `${x.slice(0, 12)}...(${x.length} chars)` : x)));

// ---------- run ----------
const files = readdirSync(path.join(here, 'expected')).filter((f) => f.endsWith('.json')).sort();
let failed = 0, passed = 0, missingFns = 0, prefixWarn = 0;
const summary = [];
for (const file of files) {
  const name = file.replace(/\.json$/, '');
  if (opt.only && !opt.only.has(name)) continue;
  const spec = FUNCTIONS[name] || {};
  const target = opt.alias[name] || name;
  let cases = JSON.parse(readFileSync(path.join(here, 'expected', file), 'utf8'));
  if (opt.scenario) cases = cases.filter((c) => c.scenario === opt.scenario);
  if (typeof impl[target] !== 'function') {
    summary.push({ name, status: opt.allowMissing ? 'SKIP' : 'MISSING', pass: 0, total: cases.length, note: `not exported as ${target}${spec.route ? ' (route lookup: pass --alias ' + name + '=<name>)' : ''}` });
    if (!opt.allowMissing) { missingFns++; failed += cases.length; }
    continue;
  }
  let pass = 0;
  const failures = [];
  let currentScenario = null;
  for (const c of cases) {
    if (c.scenario !== currentScenario) { impl.setDocLoader(loaderFor(fixture(c.scenario))); currentScenario = c.scenario; }
    let actual, threw;
    try { actual = await impl[target](...clone(c.input)); } catch (e) { threw = e; }
    const diffs = [];
    if ('throws' in c) {
      if (!threw) diffs.push({ path: '$', expected: `throws ${c.throws}`, actual });
    } else if (threw) {
      diffs.push({ path: '$', expected: c.output, actual: `threw ${threw.constructor?.name}: ${String(threw.message).slice(0, 120)}` });
    } else {
      diff(c.output, actual === undefined ? undefined : actual, '$', diffs);
      const pp = [];
      prefixProblems(actual, spec.surface, '$', pp);
      if (pp.length) {
        prefixWarn += pp.length;
        if (opt.strictPrefix) for (const x of pp) diffs.push({ path: x.path, expected: `${spec.surface === 'dataroom' ? '/dataroom' : '/partners'}/file/<id>`, actual: `${x.kind} URL` });
      }
    }
    if (diffs.length) failures.push({ c, diffs }); else pass++;
  }
  passed += pass;
  failed += cases.length - pass;
  summary.push({ name, status: pass === cases.length ? 'PASS' : 'FAIL', pass, total: cases.length, failures });
}

const w = Math.max(...summary.map((s) => s.name.length));
for (const s of summary) {
  console.log(`${s.status.padEnd(7)} ${s.name.padEnd(w)}  ${s.pass}/${s.total}${s.note ? '  ' + s.note : ''}`);
  for (const f of (s.failures || []).slice(0, opt.maxCases)) {
    console.log(`        scenario=${f.c.scenario} input=${shortInput(f.c.input)}`);
    for (const d of f.diffs.slice(0, opt.maxDiffs)) console.log(`          ${d.path}: expected ${show(d.expected)}, got ${show(d.actual)}`);
    if (f.diffs.length > opt.maxDiffs) console.log(`          ... ${f.diffs.length - opt.maxDiffs} more difference(s)`);
  }
  if (s.failures && s.failures.length > opt.maxCases) console.log(`        ... ${s.failures.length - opt.maxCases} more failing case(s)`);
}
if (typeof impl.resetDocLoader === 'function') impl.resetDocLoader();
console.log(`\n${passed} passed, ${failed} failed${missingFns ? ` (${missingFns} function(s) not exported)` : ''}${prefixWarn ? `, ${prefixWarn} file URL(s) with an unexpected prefix${opt.strictPrefix ? '' : ' (warning; --strict-prefix to fail)'}` : ''}; loader calls: byType ${loaderStats.byType}, byIds ${loaderStats.byIds}`);
process.exit(failed ? 1 : 0);
