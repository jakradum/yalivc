#!/usr/bin/env node

/**
 * Migrate LP Reports to use teamMember reference for signatory
 */

import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: token,
  useCdn: false,
});

async function migrate() {
  console.log('🔄 Migrating LP Reports to use teamMember reference for signatory...\n');

  if (!token) {
    console.error('❌ No API token found');
    process.exit(1);
  }

  // Find team member for signatory
  const members = await client.fetch(`*[_type == "teamMember"] | order(order asc) { _id, name, role }`);
  const signatory = members.find(t =>
    t.role?.toLowerCase().includes('partner') ||
    t.role?.toLowerCase().includes('investments')
  ) || members[0];

  if (!signatory) {
    console.log('❌ No team member found');
    return;
  }

  console.log(`✓ Found signatory: ${signatory.name} (${signatory.role})\n`);

  // Find LP reports
  const reports = await client.fetch(`*[_type == "lpQuarterlyReport"]{ _id, title, signatory }`);
  console.log(`Found ${reports.length} LP report(s)\n`);

  for (const report of reports) {
    // Check if signatory is not already a reference (has _ref property)
    if (report.signatory && report.signatory._ref) {
      console.log(`  ✓ "${report.title}" already has reference`);
    } else {
      console.log(`  → Updating "${report.title}"...`);
      await client.patch(report._id)
        .set({ signatory: { _type: 'reference', _ref: signatory._id } })
        .commit();
      console.log(`    ✓ Updated!`);
    }
  }

  console.log('\n✅ Migration complete!');
}

migrate().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
