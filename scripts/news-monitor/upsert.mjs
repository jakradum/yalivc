#!/usr/bin/env node
/**
 * News monitor — write captured items into the current week's `newsDigest`.
 *
 * One document per ISO week (`_id = newsDigest.<YYYY-MM-DD of Monday>`).
 * The Monday run creates the week's document; the Thursday run patches new
 * items into that same document. Idempotent: re-runs add nothing new.
 *
 * Dependency-free: talks to the Sanity HTTP API with `fetch` (Node 18+).
 * No npm install needed at run time.
 *
 * Usage:
 *   node scripts/news-monitor/upsert.mjs < items.json
 *   cat items.json | node scripts/news-monitor/upsert.mjs --dry-run
 *
 * Input: a JSON array of items on stdin. Each item:
 *   {
 *     "headline": string,            (required)
 *     "url": string,                 (required, dedupe key)
 *     "source": string,              (required)
 *     "category": "deep-tech" | "india-macro",   (required)
 *     "thesis": string,              (deep-tech only)
 *     "angle": string,               (india-macro only)
 *     "summary": string[],           (required, 3-6 bullets)
 *     "publishedDate": "YYYY-MM-DD", (required)
 *     "runId": string,               (optional; e.g. 2026-09-08-mon)
 *     "notable": boolean             (optional, default false)
 *   }
 * `capturedAt` is set here.
 *
 * Dedup: within the current week's doc AND the previous week's doc, by
 * normalised URL (so a story on the Mon/Thu boundary is not double-counted).
 *
 * Env: SANITY_WRITE_TOKEN (falls back to SANITY_API_TOKEN). For local runs the
 * script also reads these from .env.local at the repo root. In the scheduled
 * routine the variable must be present in the environment.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');

// Minimal .env.local loader (no dotenv dependency).
try {
  const txt = readFileSync(resolve(REPO_ROOT, '.env.local'), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    if (process.env[key] !== undefined) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[key] = v;
  }
} catch {
  /* no .env.local — rely on real env */
}

const DRY_RUN = process.argv.includes('--dry-run');
const CATEGORIES = new Set(['deep-tech', 'india-macro']);
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3';
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const API = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01`;
const TOKEN = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

if (!TOKEN && !DRY_RUN) {
  console.error('ERROR: SANITY_WRITE_TOKEN is not set (checked env and .env.local).');
  process.exit(1);
}

async function sanityQuery(groq, params = {}) {
  const u = new URL(`${API}/data/query/${DATASET}`);
  u.searchParams.set('query', groq);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(`$${k}`, JSON.stringify(v));
  const r = await fetch(u, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`Sanity query ${r.status}: ${await r.text()}`);
  return (await r.json()).result;
}

async function sanityMutate(mutations) {
  const r = await fetch(`${API}/data/mutate/${DATASET}?returnIds=true&visibility=async`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  });
  if (!r.ok) throw new Error(`Sanity mutate ${r.status}: ${await r.text()}`);
  return r.json();
}

/** YYYY-MM-DD of the Monday of the ISO week containing `date`, in Asia/Kolkata. */
function istMonday(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const dow = ist.getUTCDay(); // 0 Sun .. 6 Sat
  const sinceMonday = (dow + 6) % 7;
  const mon = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - sinceMonday));
  return mon.toISOString().slice(0, 10);
}

function prevMonday(mondayStr) {
  const d = new Date(`${mondayStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

function weekLabel(mondayStr) {
  const d = new Date(`${mondayStr}T00:00:00Z`);
  return `Week of ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function normaliseUrl(raw) {
  let u = String(raw || '').trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    parsed.hash = '';
    for (const k of [...parsed.searchParams.keys()]) {
      if (/^utm_|^fbclid$|^gclid$|^mc_/i.test(k)) parsed.searchParams.delete(k);
    }
    let s = parsed.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch {
    return u;
  }
}

function keyFor(url) {
  return createHash('sha1').update(normaliseUrl(url)).digest('hex').slice(0, 16);
}

function readStdin() {
  return new Promise((res, rej) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => res(data));
    process.stdin.on('error', rej);
  });
}

function validate(item, i) {
  const errs = [];
  if (!item || typeof item !== 'object') return [`item ${i}: not an object`];
  if (!item.headline) errs.push(`item ${i}: missing headline`);
  if (!item.url) errs.push(`item ${i}: missing url`);
  if (!item.source) errs.push(`item ${i}: missing source`);
  if (!CATEGORIES.has(item.category)) errs.push(`item ${i}: bad category "${item.category}"`);
  if (!Array.isArray(item.summary) || item.summary.length < 3 || item.summary.length > 6) {
    errs.push(`item ${i}: summary must be an array of 3-6 bullets`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.publishedDate || '')) {
    errs.push(`item ${i}: publishedDate must be YYYY-MM-DD`);
  }
  return errs;
}

function toEntry(item) {
  const entry = {
    _type: 'intelEntry',
    _key: keyFor(item.url),
    headline: String(item.headline).trim(),
    url: normaliseUrl(item.url),
    source: String(item.source).trim(),
    category: item.category,
    summary: item.summary.map((s) => String(s).trim()).filter(Boolean),
    publishedDate: item.publishedDate,
    capturedAt: new Date().toISOString(),
    notable: Boolean(item.notable),
  };
  if (item.runId) entry.runId = String(item.runId).trim();
  if (item.category === 'deep-tech' && item.thesis) entry.thesis = String(item.thesis).trim();
  if (item.category === 'india-macro' && item.angle) entry.angle = String(item.angle).trim();
  return entry;
}

function tally(list) {
  const out = { 'deep-tech': 0, 'india-macro': 0 };
  for (const x of list) out[x.category] = (out[x.category] || 0) + 1;
  return out;
}

async function main() {
  const raw = await readStdin();
  let items;
  try {
    items = JSON.parse(raw);
  } catch (e) {
    console.error('ERROR: stdin is not valid JSON:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(items)) {
    console.error('ERROR: expected a JSON array of items.');
    process.exit(1);
  }

  const monday = istMonday();
  const docId = `newsDigest.${monday}`;
  const prevId = `newsDigest.${prevMonday(monday)}`;
  const runId = items.find((it) => it && it.runId)?.runId || `${monday}-run`;

  const valid = [];
  const problems = [];
  items.forEach((it, i) => {
    const errs = validate(it, i);
    if (errs.length) problems.push(...errs);
    else valid.push(it);
  });
  problems.forEach((p) => console.warn('SKIP', p));

  // de-dupe within the incoming batch by key
  const byKey = new Map();
  for (const it of valid) byKey.set(keyFor(it.url), it);
  const entries = [...byKey.values()].map(toEntry);
  const added = tally(entries);

  if (DRY_RUN) {
    console.log(JSON.stringify({ dryRun: true, weekOf: monday, docId, wouldAdd: added, entries }, null, 2));
    console.log(
      `${monday} ${runId}: +${added['deep-tech']} deep-tech / +${added['india-macro']} india-macro (dry run)`
    );
    return;
  }

  // de-dupe against this week's doc + last week's doc
  const rows = await sanityQuery(
    '*[_id in $ids]{_id, "keys": items[]._key, "cats": items[].category, runs}',
    { ids: [docId, prevId] }
  );
  const existingKeys = new Set();
  let weekCats = [];
  let existingRuns = [];
  for (const r of rows) {
    for (const k of r.keys || []) existingKeys.add(k);
    if (r._id === docId) {
      weekCats = r.cats || [];
      existingRuns = r.runs || [];
    }
  }
  const fresh = entries.filter((e) => !existingKeys.has(e._key));
  const freshAdded = tally(fresh);
  const before = { 'deep-tech': 0, 'india-macro': 0 };
  for (const c of weekCats) before[c] = (before[c] || 0) + 1;

  const mutations = [
    {
      createIfNotExists: {
        _id: docId,
        _type: 'newsDigest',
        weekOf: monday,
        title: weekLabel(monday),
        runs: [],
        items: [],
      },
    },
  ];

  const patch = { id: docId, setIfMissing: { items: [], runs: [] } };
  if (fresh.length) {
    if (weekCats.length === 0) {
      patch.set = { items: fresh };
    } else {
      patch.insert = { after: 'items[-1]', items: fresh };
    }
  }
  patch.set = patch.set || {};
  patch.set.runs = existingRuns.includes(runId) ? existingRuns : [...existingRuns, runId];
  patch.set.title = weekLabel(monday);
  mutations.push({ patch });

  await sanityMutate(mutations);

  console.log(
    `${monday} ${runId}: +${freshAdded['deep-tech']} deep-tech / +${freshAdded['india-macro']} india-macro ` +
      `(week total ${before['deep-tech'] + freshAdded['deep-tech']} / ${before['india-macro'] + freshAdded['india-macro']})` +
      (problems.length ? ` / skipped: ${problems.length}` : '')
  );
}

main().catch((e) => {
  console.error('ERROR:', e.message || e);
  process.exit(1);
});
