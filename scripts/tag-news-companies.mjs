/**
 * Match each news article to portfolio companies and set news.relatedCompanies
 * (an array of references) — the field the company page's "In the press" section reads.
 *
 *   node scripts/tag-news-companies.mjs            # dry run — prints proposed matches
 *   node scripts/tag-news-companies.mjs --write    # apply the matches to Sanity
 *
 * Matching is conservative: a company matches only if one of its names/aliases
 * appears as a whole word in the headline, or its slug appears in the article URL.
 * MANUAL_MATCHES covers articles whose portco isn't named in the headline.
 */

// headline substring (lowercase) -> company slug. For articles the matcher can't catch.
const MANUAL_MATCHES = [
  ['indigenous data gap in precision oncology', '4basecare'],
];

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const WRITE = process.argv.includes('--write');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// Company names too generic to match on safely.
const STOPWORDS = new Set(['the', 'and', 'labs', 'tech', 'technologies', 'inc', 'ltd', 'india']);

const norm = s => (s || '').toLowerCase().replace(/[‘’“”]/g, "'");

const SUFFIX_RE = /\b(technologies|technology|labs?|robotics|semiconductors?|imaging|genomics|systems|solutions|software|inc\.?|ltd\.?|pvt\.?|private limited|corp\.?)\b/g;

function nameVariants(name) {
  const n = norm(name).trim();
  const variants = new Set([n]);
  const stripped = n.replace(SUFFIX_RE, '').replace(/\s+/g, ' ').trim();
  if (stripped && stripped !== n) variants.add(stripped);
  return [...variants].filter(v => v.length >= 3 && !STOPWORDS.has(v));
}

const compact = s => s.replace(/[^a-z0-9]/gi, '').toLowerCase();

function wholeWordMatch(haystack, needle) {
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, 'i').test(haystack)) return true;
  // "PointAI" vs "Point AI" — collapse separators when the needle is distinctive
  const nc = compact(needle);
  return nc.length >= 6 && compact(haystack).includes(nc);
}

async function main() {
  const rawCompanies = await client.fetch(
    `*[_type == "company"]{ _id, name, "slug": slug.current, showOnMainWebsite }`
  );
  // Collapse duplicate company docs that share a slug (keep the one shown on the site).
  const bySlug = new Map();
  for (const c of rawCompanies) {
    const key = c.slug || c._id;
    const prev = bySlug.get(key);
    if (!prev || (!prev.showOnMainWebsite && c.showOnMainWebsite)) bySlug.set(key, c);
  }
  const companies = [...bySlug.values()];
  if (companies.length !== rawCompanies.length) {
    console.log(`(collapsed ${rawCompanies.length - companies.length} duplicate company doc(s) by slug)\n`);
  }
  const news = await client.fetch(
    `*[_type == "news"] | order(date desc){
      _id, headlineEdited, url, date,
      "existing": relatedCompanies[]->name
    }`
  );

  console.log(`${companies.length} companies, ${news.length} news articles\n`);

  const bySlugMap = new Map(companies.map(c => [c.slug, c]));

  const proposals = [];   // { item, companies: [] }
  const unmatched = [];
  const already = [];

  for (const item of news) {
    const hay = norm(item.headlineEdited);
    const url = norm(item.url);
    const hits = new Map();
    for (const c of companies) {
      const slugHit = c.slug && url.includes(`/${c.slug}`);
      const nameHit = nameVariants(c.name).some(v => wholeWordMatch(hay, v));
      if (slugHit || nameHit) hits.set(c._id, c);
    }
    for (const [needle, slug] of MANUAL_MATCHES) {
      if (hay.includes(needle) && bySlugMap.has(slug)) {
        const c = bySlugMap.get(slug);
        hits.set(c._id, c);
      }
    }
    const matched = [...hits.values()];

    if (item.existing?.length) already.push({ item, current: item.existing });
    else if (matched.length) proposals.push({ item, companies: matched });
    else unmatched.push(item);
  }

  console.log(`── PROPOSED (${proposals.length}) ─────────────────────────────`);
  for (const p of proposals) console.log(`  [${p.companies.map(c => c.name).join(', ')}]  ${p.item.headlineEdited}`);

  console.log(`\n── ALREADY TAGGED (${already.length}) ────────────────────────`);
  for (const a of already) console.log(`  [${a.current.join(', ')}]  ${a.item.headlineEdited}`);

  console.log(`\n── NO MATCH (${unmatched.length}) ───────────────────────────`);
  for (const u of unmatched) console.log(`  ${u.headlineEdited}`);

  if (!WRITE) {
    console.log(`\nDry run. Re-run with --write to apply the ${proposals.length} proposed matches.`);
    return;
  }

  console.log(`\nWriting relatedCompanies on ${proposals.length} articles…`);
  let ok = 0;
  for (const p of proposals) {
    await client
      .patch(p.item._id)
      .set({
        relatedCompanies: p.companies.map(c => ({
          _key: Math.random().toString(16).slice(2, 14),
          _type: 'reference',
          _ref: c._id,
        })),
      })
      .commit();
    ok++;
  }
  console.log(`Done. ${ok} articles tagged.`);
}

main().catch(e => { console.error(e); process.exit(1); });
