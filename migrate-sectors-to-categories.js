import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const sectorToCategoryMap = {
  'robotics': 'robotics',
  'semiconductors': 'semiconductors',
  'genomics': 'life-sciences',
  'generative-ai': 'artificial-intelligence',
  'advanced-manufacturing': 'smart-manufacturing',
  'aerospace-defence': 'defence',
};

async function migrate() {
  const sectors = await client.fetch(`*[_type == "sector"]`);
  
  for (const sector of sectors) {
    const categorySlug = sectorToCategoryMap[sector.slug.current];
    if (!categorySlug) {
      console.log(`No mapping for ${sector.slug.current}`);
      continue;
    }
    
    const category = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0]`,
      { slug: categorySlug }
    );
    
    if (category) {
      await client.patch(category._id)
        .set({
          overview: sector.overview,
          whyYALICares: sector.whyYALICares,
        })
        .commit();
      
      console.log(`✓ Migrated ${sector.name} → ${category.name}`);
    }
  }
}

migrate().catch(console.error);