/**
 * One-time import of historical newsletter subscribers from Airtable CSV.
 * Dates in the CSV are DD/MM/YYYY (Indian format).
 *
 * Usage:
 *   SANITY_API_TOKEN=<your-token> node scripts/import-newsletter-subscribers.mjs
 */

import { createClient } from 'next-sanity';

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// CSV data — dates converted from DD/MM/YYYY to ISO 8601
const subscribers = [
  { email: 'pranavmain@gmail.com',               subscribedAt: '2025-12-08T00:00:00.000Z' },
  { email: 'faisal.khan@sony.com',               subscribedAt: '2025-12-09T00:00:00.000Z' },
  { email: 'anubhvjn@amazon.com',                subscribedAt: '2025-12-15T00:00:00.000Z' },
  { email: '5ivatej@proton.me',                  subscribedAt: '2025-12-16T00:00:00.000Z' },
  { email: 'anubhvjn@amazon.com',                subscribedAt: '2025-12-19T00:00:00.000Z' },
  { email: 'xotomuhuc893@gmail.com',             subscribedAt: '2025-12-19T00:00:00.000Z' },
  { email: 'ajay.apsoni@gmail.com',              subscribedAt: '2025-12-30T00:00:00.000Z' },
  { email: 'aparna.bhalla16@gmail.com',          subscribedAt: '2026-01-07T00:00:00.000Z' },
  { email: 'jobsvirendra@gmail.com',             subscribedAt: '2026-01-16T00:00:00.000Z' },
  { email: 'simra.khan@successpact.com',         subscribedAt: '2026-01-20T00:00:00.000Z' },
  { email: 'karan.bayad.c2024@iitbombay.org',   subscribedAt: '2026-02-04T00:00:00.000Z' },
  { email: 'guravaiah@gmail.com',                subscribedAt: '2026-02-06T00:00:00.000Z' },
  { email: 'guravaiah@gmail.com',                subscribedAt: '2026-02-08T00:00:00.000Z' },
  { email: 'boohay@zoho.com',                    subscribedAt: '2026-02-16T00:00:00.000Z' },
  { email: 'bhavya@krafton.com',                 subscribedAt: '2026-02-16T00:00:00.000Z' },
  { email: 'ajaypramod.cit@gmail.com',           subscribedAt: '2026-02-16T00:00:00.000Z' },
  { email: 'pallavi@unicornivc.com',             subscribedAt: '2026-02-20T00:00:00.000Z' },
  { email: 'ankitmantri@hotmail.com',            subscribedAt: '2026-02-21T00:00:00.000Z' },
];

if (!process.env.SANITY_API_TOKEN) {
  console.error('Error: SANITY_API_TOKEN environment variable is not set.');
  process.exit(1);
}

console.log(`Importing ${subscribers.length} subscribers...`);

for (const sub of subscribers) {
  try {
    const doc = await client.create({
      _type: 'newsletterSubscriber',
      email: sub.email,
      subscribedAt: sub.subscribedAt,
      source: 'import',
    });
    console.log(`  ✓ ${sub.email} (${sub.subscribedAt.slice(0, 10)}) → ${doc._id}`);
  } catch (err) {
    console.error(`  ✗ ${sub.email}: ${err.message}`);
  }
}

console.log('Done.');
