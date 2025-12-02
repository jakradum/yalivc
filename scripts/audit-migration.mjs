/**
 * Audit remaining category migration work
 */

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const NEW_SLUGS = [
  'artificial-intelligence',
  'aerospace-and-surveillance',
  'life-sciences',
  'robotics',
  'fabless-semiconductor',
  'smart-manufacturing'
];

async function audit() {
  console.log('=== AUDIT: Remaining Migration Work ===\n');

  // 1. All categories
  const categories = await client.fetch(`*[_type == 'category']{_id, name, slug, published}`);
  console.log('📁 ALL CATEGORIES:');
  categories.forEach(c => console.log(`  - ${c.name} (${c.slug?.current}) [published: ${c.published}]`));

  // 2. All sectors with their category refs
  const sectors = await client.fetch(`*[_type == 'sector']{_id, name, slug, 'catName': category->name, 'catSlug': category->slug.current}`);
  console.log('\n📂 ALL SECTORS & THEIR CATEGORIES:');
  sectors.forEach(s => console.log(`  - ${s.name} → ${s.catName || 'NO CATEGORY'} (${s.catSlug || 'null'})`));

  // 3. Old categories that need deletion
  console.log('\n⚠️  OLD CATEGORIES TO DELETE:');
  const oldCats = categories.filter(c => !NEW_SLUGS.includes(c.slug?.current));
  if (oldCats.length === 0) {
    console.log('  None - all old categories already deleted!');
  } else {
    oldCats.forEach(c => console.log(`  - ${c.name} (ID: ${c._id})`));
  }

  // 4. Sectors with missing/old category references
  console.log('\n🔧 SECTORS NEEDING CATEGORY UPDATE:');
  const needsUpdate = sectors.filter(s => !NEW_SLUGS.includes(s.catSlug));
  if (needsUpdate.length === 0) {
    console.log('  None - all sectors correctly linked!');
  } else {
    needsUpdate.forEach(s => console.log(`  - ${s.name} → currently: ${s.catSlug || 'null'}`));
  }

  // 5. Companies check
  const companies = await client.fetch(`*[_type == 'company']{_id, name, 'catName': category->name, 'catSlug': category->slug.current}`);
  console.log('\n🏢 ALL COMPANIES & THEIR CATEGORIES:');
  companies.forEach(c => console.log(`  - ${c.name} → ${c.catName} (${c.catSlug})`));

  const companiesNeedUpdate = companies.filter(c => !NEW_SLUGS.includes(c.catSlug));
  if (companiesNeedUpdate.length > 0) {
    console.log('\n⚠️  COMPANIES NEEDING CATEGORY UPDATE:');
    companiesNeedUpdate.forEach(c => console.log(`  - ${c.name} → currently: ${c.catSlug || 'null'}`));
  }

  console.log('\n=== AUDIT COMPLETE ===');
}

audit().catch(console.error);
