/**
 * One-time script: set dataRoomAccess: true on all existing portalUser records
 * Safe to run only AFTER deleting the Sanity webhook — no emails will fire.
 * Run from project root: node scripts/bulk-enable-dataroom.cjs
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

async function run() {
  const users = await client.fetch(`*[_type == "portalUser" && dataRoomAccess != true]{ _id, email }`);
  console.log(`Users without dataRoomAccess: ${users.length}`);

  if (users.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  const BATCH = 50;
  let updated = 0;

  for (let i = 0; i < users.length; i += BATCH) {
    const batch = users.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const u of batch) {
      tx.patch(u._id, { set: { dataRoomAccess: true } });
    }
    await tx.commit();
    updated += batch.length;
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: updated ${batch.length} (total ${updated})`);
  }

  console.log(`\nDone. ${updated} users updated to dataRoomAccess: true.`);
}

run().catch(err => { console.error(err); process.exit(1); });
