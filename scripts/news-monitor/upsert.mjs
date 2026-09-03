#!/usr/bin/env node
/**
 * News monitor — write captured items to Sanity as `intelItem` documents.
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
 *     "runId": string,               (optional)
 *     "notable": boolean             (optional, default false)
 *   }
 * `capturedAt` is set here.
 *
 * Dedup: `_id` is derived from a sha1 of the normalised URL, so re-runs are
 * idempotent (`createIfNotExists`). Prints a summary line the routine can log.
 *
 * Env: SANITY_WRITE_TOKEN (falls back to SANITY_API_TOKEN). Reads .env.local
 * for local runs; in the scheduled routine the var is in the environment.
 */

import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');
const CATEGORIES = new Set(['deep-tech', 'india-macro']);

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!token && !DRY_RUN) {
  console.error('ERROR: SANITY_WRITE_TOKEN is not set.');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

function normaliseUrl(raw) {
  let u = String(raw || '').trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    parsed.hash = '';
    // strip common tracking params
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

function idFor(url) {
  return 'intel.' + createHash('sha1').update(normaliseUrl(url)).digest('hex').slice(0, 24);
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

function toDoc(item) {
  const capturedAt = new Date().toISOString();
  const doc = {
    _id: idFor(item.url),
    _type: 'intelItem',
    headline: String(item.headline).trim(),
    url: normaliseUrl(item.url),
    source: String(item.source).trim(),
    category: item.category,
    summary: item.summary.map((s) => String(s).trim()).filter(Boolean),
    publishedDate: item.publishedDate,
    capturedAt,
    notable: Boolean(item.notable),
  };
  if (item.runId) doc.runId = String(item.runId).trim();
  if (item.category === 'deep-tech' && item.thesis) doc.thesis = String(item.thesis).trim();
  if (item.category === 'india-macro' && item.angle) doc.angle = String(item.angle).trim();
  return doc;
}

function tallyByCategory(list, keyFn) {
  const out = { 'deep-tech': 0, 'india-macro': 0 };
  for (const x of list) out[keyFn(x)] = (out[keyFn(x)] || 0) + 1;
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

  const valid = [];
  const problems = [];
  items.forEach((it, i) => {
    const errs = validate(it, i);
    if (errs.length) problems.push(...errs);
    else valid.push(it);
  });
  problems.forEach((p) => console.warn('SKIP', p));

  // de-dupe within the batch by _id
  const byId = new Map();
  for (const it of valid) byId.set(idFor(it.url), it);
  const docs = [...byId.values()].map(toDoc);

  const checked = tallyByCategory(docs, (d) => d.category);

  // which already exist?
  const ids = docs.map((d) => d._id);
  let existing = new Set();
  if (ids.length && !DRY_RUN) {
    const rows = await client.fetch('*[_type=="intelItem" && _id in $ids]{_id}', { ids });
    existing = new Set(rows.map((r) => r._id));
  }
  const fresh = docs.filter((d) => !existing.has(d._id));
  const created = tallyByCategory(fresh, (d) => d.category);

  if (DRY_RUN) {
    console.log(JSON.stringify({ dryRun: true, checked, wouldCreate: created, fresh }, null, 2));
  } else if (fresh.length) {
    let tx = client.transaction();
    for (const d of fresh) tx = tx.createIfNotExists(d);
    await tx.commit({ visibility: 'async' });
  }

  const runId = docs.find((d) => d.runId)?.runId || new Date().toISOString().slice(0, 10);
  console.log(
    `${runId} deep-tech: ${created['deep-tech']} new (${checked['deep-tech']} checked) / ` +
      `india-macro: ${created['india-macro']} new (${checked['india-macro']} checked)` +
      (problems.length ? ` / skipped: ${problems.length}` : '')
  );
}

main().catch((e) => {
  console.error('ERROR:', e.message || e);
  process.exit(1);
});
