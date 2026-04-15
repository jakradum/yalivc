// scripts/seed-recommendation-refs.js
//
// Patches the dataroomFundContent singleton to populate commonRecommendationDocuments
// with references to all existing dataRoomDocument records with category == "recommendation".
//
// Run: SANITY_WRITE_TOKEN=<token> node scripts/seed-recommendation-refs.js

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
  console.log('Fetching recommendation documents...');

  const docs = await client.fetch(
    `*[_type == "dataRoomDocument" && category == "recommendation"] | order(title asc) { _id, title }`
  );

  if (docs.length === 0) {
    console.log('No recommendation documents found. Nothing to do.');
    return;
  }

  console.log(`Found ${docs.length} recommendation document(s):`);
  docs.forEach((d) => console.log(`  · ${d.title} (${d._id})`));

  const references = docs.map((d) => ({
    _type: 'reference',
    _ref: d._id,
    _key: d._id,
  }));

  console.log('\nPatching dataroomFundContent singleton...');

  await client
    .patch('dataroomFundContent')
    .setIfMissing({ commonRecommendationDocuments: [] })
    .set({ commonRecommendationDocuments: references })
    .commit({ autoGenerateArrayKeys: false });

  console.log(`✓ dataroomFundContent.commonRecommendationDocuments set to ${references.length} reference(s).`);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
