/**
 * Fix remaining migration issues:
 * 1. Link sectors with null category references
 * 2. Delete old categories
 */

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes('--dry-run');

// Sector name → new category slug mapping
const SECTOR_TO_CATEGORY = {
  'Artificial Intelligence': 'artificial-intelligence',
  'Life Sciences': 'life-sciences',
  'Semiconductors': 'fabless-semiconductor',
  'Advanced Manufacturing': 'smart-manufacturing',
  'Robotics': 'robotics',
  // Add any others as needed
};

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN MODE\n' : '🚀 EXECUTING FIXES\n');

  // Get category ID map
  const categories = await client.fetch(`*[_type == 'category']{_id, name, slug}`);
  const categoryIdBySlug = {};
  categories.forEach(c => {
    if (c.slug?.current) {
      categoryIdBySlug[c.slug.current] = c._id;
    }
  });

  // 1. Fix sectors with null category references
  console.log('--- Fixing Sectors ---');
  const sectors = await client.fetch(`*[_type == 'sector']{_id, name, 'catSlug': category->slug.current}`);

  for (const sector of sectors) {
    if (!sector.catSlug) {
      const newCatSlug = SECTOR_TO_CATEGORY[sector.name];
      if (newCatSlug && categoryIdBySlug[newCatSlug]) {
        console.log(`✅ ${sector.name} → ${newCatSlug}`);
        if (!DRY_RUN) {
          await client.patch(sector._id)
            .set({ category: { _type: 'reference', _ref: categoryIdBySlug[newCatSlug] } })
            .commit();
        }
      } else {
        console.log(`⚠️ ${sector.name} - no mapping found`);
      }
    }
  }

  // 2. Delete old categories
  console.log('\n--- Deleting Old Categories ---');
  const oldCategoryIds = [
    '07cdc32d-d41c-4378-9d2a-56641da77ffa', // Strategic tech
    'd4d11cb0-8dde-4737-916f-fd6fdabf9a0a', // Defence
    'hY1KZnhsaIM4Q2Zu6tPC56',              // semiconductors
  ];

  for (const id of oldCategoryIds) {
    const cat = categories.find(c => c._id === id);
    if (cat) {
      console.log(`🗑️  Deleting: ${cat.name}`);
      if (!DRY_RUN) {
        try {
          await client.delete(id);
        } catch (err) {
          console.log(`   ❌ Error: ${err.message}`);
        }
      }
    }
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
