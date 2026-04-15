// scripts/reset-dataroom-access.js
//
// Sets investorDataRoomAccess: false on ALL portalUser documents.
// Run after migrate-portal-users.js to correct the legacy state where
// dataRoomAccess was incorrectly true for all users.
//
// After this runs, manually enable investorDataRoomAccess in Sanity Studio
// for the specific users who should have Data Room access.
//
// Run: SANITY_WRITE_TOKEN=<token> node scripts/reset-dataroom-access.js

import { createClient } from '@sanity/client';

if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('Error: SANITY_WRITE_TOKEN environment variable is required.');
  process.exit(1);
}

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

async function run() {
  console.log('Fetching all portalUser documents...');

  const users = await client.fetch(
    `*[_type == "portalUser"]{ _id, email, investorDataRoomAccess }`
  );

  console.log(`Found ${users.length} portalUser document(s).\n`);

  let patched = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await client.patch(user._id).set({ investorDataRoomAccess: false }).commit();
      console.log(`✓  ${user.email}`);
      patched++;
    } catch (err) {
      console.error(`✗  ${user.email} — failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Patched : ${patched}`);
  console.log(`Failed  : ${failed}`);
  console.log(`Total   : ${users.length}`);
  console.log(`\nAll users now have investorDataRoomAccess: false.`);
  console.log(`Re-enable it manually in Sanity Studio for the users who need Data Room access.`);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
