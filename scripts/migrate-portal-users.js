// scripts/migrate-portal-users.js
//
// One-time migration: populate new access fields on all portalUser documents.
//
// What it does per document:
//   noAccess              = isActive === true ? false : true   (inverted logic)
//   lpPortalAccess        = true                               (all existing users get portal access)
//   investorDataRoomAccess = dataRoomAccess === true           (direct rename)
//
// What it does NOT do:
//   - Does not remove isActive or dataRoomAccess (leave in place until confirmed)
//   - Does not touch isGiftCityLP, source, inviteCode, inviteCodeExpiry
//
// Run: SANITY_WRITE_TOKEN=<token> node scripts/migrate-portal-users.js

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
    `*[_type == "portalUser"]{ _id, email, isActive, dataRoomAccess }`
  );

  console.log(`Found ${users.length} portalUser document(s).\n`);

  let patched = 0;
  let failed = 0;

  for (const user of users) {
    const newNoAccess = user.isActive === true ? false : true;
    const newInvestorDataRoomAccess = user.dataRoomAccess === true;

    try {
      await client
        .patch(user._id)
        .set({
          noAccess: newNoAccess,
          lpPortalAccess: true,
          investorDataRoomAccess: newInvestorDataRoomAccess,
        })
        .commit();

      console.log(
        `✓  ${user.email.padEnd(40)} ` +
        `noAccess: ${String(newNoAccess).padEnd(6)} ` +
        `lpPortalAccess: true  ` +
        `investorDataRoomAccess: ${newInvestorDataRoomAccess}`
      );
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
  console.log(`\nOld fields (isActive, dataRoomAccess) left untouched.`);
  console.log(`Confirm the new fields are working before removing them.`);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
