// Add emails to the portal allowlist in Sanity
//
// Usage:
//   node scripts/invite-users.js email1@example.com email2@example.com
//
// Requires: SANITY_API_TOKEN in .env.local (or pass as env var)

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@sanity/client';

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3';
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const TOKEN = process.env.SANITY_API_TOKEN;

if (!TOKEN) {
  console.error('SANITY_API_TOKEN not found.');
  console.error('Make sure .env.local has SANITY_API_TOKEN or pass it as an env var.');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  token: TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function addPortalUser(email) {
  const existing = await client.fetch(
    `*[_type == "portalUser" && lower(email) == $email][0]`,
    { email: email.toLowerCase() }
  );

  if (existing) {
    console.log(`  SKIP: ${email} (already exists)`);
    return { email, skipped: true };
  }

  await client.create({
    _type: 'portalUser',
    email: email.toLowerCase(),
    isActive: true,
  });

  console.log(`  ADDED: ${email}`);
  return { email, skipped: false };
}

async function main() {
  const emails = process.argv.slice(2).filter((a) => a.includes('@'));

  if (emails.length === 0) {
    console.log('No emails provided.');
    console.log('Usage: node scripts/invite-users.js email1@example.com email2@example.com');
    process.exit(0);
  }

  console.log(`Adding ${emails.length} email(s) to portal allowlist...\n`);

  const results = [];
  for (const email of emails) {
    try {
      const result = await addPortalUser(email.trim());
      results.push(result);
    } catch (err) {
      console.error(`  ERROR: ${email} — ${err.message}`);
      results.push({ email, error: err.message });
    }
  }

  const added = results.filter((r) => !r.skipped && !r.error);
  const skipped = results.filter((r) => r.skipped);
  const errors = results.filter((r) => r.error);

  console.log(`\nDone: ${added.length} added, ${skipped.length} skipped, ${errors.length} errors`);
}

main();
