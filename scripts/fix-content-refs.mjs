/**
 * Fix blog/news references to old categories, then delete old categories
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

// Old category ID → New category slug
const OLD_TO_NEW = {
  '07cdc32d-d41c-4378-9d2a-56641da77ffa': 'aerospace-and-surveillance', // Strategic tech
  'd4d11cb0-8dde-4737-916f-fd6fdabf9a0a': 'aerospace-and-surveillance', // Defence
  'hY1KZnhsaIM4Q2Zu6tPC56': 'fabless-semiconductor',                    // semiconductors
};

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN MODE\n' : '🚀 EXECUTING FIXES\n');

  // Get new category IDs
  const categories = await client.fetch(`*[_type == 'category']{_id, slug}`);
  const newCatIdBySlug = {};
  categories.forEach(c => {
    if (c.slug?.current) newCatIdBySlug[c.slug.current] = c._id;
  });

  // Find all documents referencing old categories
  console.log('--- Finding references to old categories ---');

  for (const [oldId, newSlug] of Object.entries(OLD_TO_NEW)) {
    const newId = newCatIdBySlug[newSlug];
    if (!newId) {
      console.log(`⚠️ New category ${newSlug} not found!`);
      continue;
    }

    // Find blog posts with this category in categories[] array
    const blogPosts = await client.fetch(
      `*[_type == 'blogPost' && $oldId in categories[]._ref]{_id, title, categories}`,
      { oldId }
    );

    for (const post of blogPosts) {
      console.log(`📝 Blog: "${post.title}" - updating category ref`);
      if (!DRY_RUN) {
        // Replace old ref with new ref in categories array
        const newCategories = post.categories.map(cat =>
          cat._ref === oldId ? { _type: 'reference', _ref: newId, _key: cat._key } : cat
        );
        await client.patch(post._id).set({ categories: newCategories }).commit();
      }
    }

    // Find news with this category in relatedCategories[] array
    const news = await client.fetch(
      `*[_type == 'news' && $oldId in relatedCategories[]._ref]{_id, headlineEdited, relatedCategories}`,
      { oldId }
    );

    for (const item of news) {
      console.log(`📰 News: "${item.headlineEdited}" - updating category ref`);
      if (!DRY_RUN) {
        const newRelated = item.relatedCategories.map(cat =>
          cat._ref === oldId ? { _type: 'reference', _ref: newId, _key: cat._key } : cat
        );
        await client.patch(item._id).set({ relatedCategories: newRelated }).commit();
      }
    }
  }

  // Now try deleting old categories again
  console.log('\n--- Deleting Old Categories ---');
  for (const oldId of Object.keys(OLD_TO_NEW)) {
    const cat = categories.find(c => c._id === oldId);
    if (cat) {
      console.log(`🗑️  Deleting category ID: ${oldId}`);
      if (!DRY_RUN) {
        try {
          await client.delete(oldId);
          console.log(`   ✅ Deleted!`);
        } catch (err) {
          console.log(`   ❌ Error: ${err.message}`);
        }
      }
    }
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
