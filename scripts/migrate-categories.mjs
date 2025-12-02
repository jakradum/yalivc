/**
 * Sanity Category Migration Script
 * Migrates from old multi-category system to 6 consolidated categories
 *
 * Usage:
 *   node scripts/migrate-categories.mjs --dry-run    # Preview changes
 *   node scripts/migrate-categories.mjs              # Execute migration
 */

import { createClient } from '@sanity/client';

// ============ CONFIGURATION ============
const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false, // Must be false for mutations
};

const client = createClient(config);

// ============ NEW CATEGORIES ============
const NEW_CATEGORIES = [
  {
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    description: 'AI and machine learning technologies reshaping industries through intelligent automation and data-driven insights.',
    order: 1
  },
  {
    name: 'Aerospace and Surveillance',
    slug: 'aerospace-and-surveillance',
    description: 'Defence, aerospace, and strategic technologies critical to national security and space exploration.',
    order: 2
  },
  {
    name: 'Life Sciences',
    slug: 'life-sciences',
    description: 'Biotechnology, genomics, and healthcare innovations improving quality of life globally.',
    order: 3
  },
  {
    name: 'Robotics',
    slug: 'robotics',
    description: 'Advanced robotics and automation systems transforming manufacturing and service industries.',
    order: 4
  },
  {
    name: 'Fabless Semiconductor',
    slug: 'fabless-semiconductor',
    description: 'Chip design and semiconductor technologies powering the digital economy.',
    order: 5
  },
  {
    name: 'Smart Manufacturing',
    slug: 'smart-manufacturing',
    description: 'Industry 4.0 technologies enabling intelligent, connected, and efficient production systems.',
    order: 6
  },
];

// ============ CATEGORY MAPPING (old slug → new slug) ============
const CATEGORY_MAPPING = {
  'artificial-intelligence': 'artificial-intelligence',
  'generative-ai': 'artificial-intelligence',
  'genomics': 'life-sciences',
  'life-sciences': 'life-sciences',
  'semiconductors': 'fabless-semiconductor',
  'fabless-chip-design': 'fabless-semiconductor',
  'defence': 'aerospace-and-surveillance',
  'strategic-tech': 'aerospace-and-surveillance',
  'aerospace': 'aerospace-and-surveillance',
  'advanced-manufacturing': 'smart-manufacturing',
  'smart-manufacturing': 'smart-manufacturing',
  'robotics': 'robotics',
};

// ============ STATE ============
const DRY_RUN = process.argv.includes('--dry-run');
const results = {
  categoriesCreated: [],
  categoriesUpdated: [],
  companiesReassigned: [],
  sectorsUpdated: [],
  errors: [],
  oldCategoriesToDelete: [],
};

// ============ HELPERS ============
function log(message, type = 'info') {
  const prefix = DRY_RUN ? '[DRY-RUN] ' : '';
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  console.log(`${icons[type] || ''} ${prefix}${message}`);
}

function normalizeSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ============ STEP 1: FETCH CURRENT STATE ============
async function fetchCurrentState() {
  log('Fetching current Sanity data...');

  const [categories, companies, sectors] = await Promise.all([
    client.fetch(`*[_type == "category"]{_id, name, slug, description, order, published}`),
    client.fetch(`*[_type == "company"]{_id, name, slug, "categoryId": category._ref, "categoryName": category->name, "categorySlug": category->slug.current}`),
    client.fetch(`*[_type == "sector"]{_id, name, slug, "categoryId": category._ref, "categoryName": category->name, "categorySlug": category->slug.current}`),
  ]);

  log(`Found ${categories.length} categories`);
  log(`Found ${companies.length} companies`);
  log(`Found ${sectors.length} sectors`);

  return { categories, companies, sectors };
}

// ============ STEP 2: CREATE/UPDATE CATEGORIES ============
async function createOrUpdateCategories(existingCategories) {
  log('\n--- Creating/Updating Categories ---');

  const categoryIdMap = {}; // slug → _id

  for (const newCat of NEW_CATEGORIES) {
    const existing = existingCategories.find(
      c => c.slug?.current === newCat.slug || normalizeSlug(c.name) === newCat.slug
    );

    if (existing) {
      // Update existing category
      log(`Category "${newCat.name}" already exists (ID: ${existing._id})`);
      categoryIdMap[newCat.slug] = existing._id;

      // Update description and order if needed
      if (!DRY_RUN) {
        await client.patch(existing._id)
          .set({
            name: newCat.name,
            description: newCat.description,
            order: newCat.order,
            published: true,
            slug: { _type: 'slug', current: newCat.slug }
          })
          .commit();
      }
      results.categoriesUpdated.push({ name: newCat.name, id: existing._id });
    } else {
      // Create new category
      log(`Creating category: "${newCat.name}"`, 'success');

      if (!DRY_RUN) {
        const created = await client.create({
          _type: 'category',
          name: newCat.name,
          slug: { _type: 'slug', current: newCat.slug },
          description: newCat.description,
          order: newCat.order,
          published: true,
        });
        categoryIdMap[newCat.slug] = created._id;
        results.categoriesCreated.push({ name: newCat.name, id: created._id });
      } else {
        categoryIdMap[newCat.slug] = `new-${newCat.slug}`;
        results.categoriesCreated.push({ name: newCat.name, id: `[will be created]` });
      }
    }
  }

  return categoryIdMap;
}

// ============ STEP 3: REASSIGN COMPANIES ============
async function reassignCompanies(companies, categoryIdMap, existingCategories) {
  log('\n--- Reassigning Companies ---');

  // Build lookup from old category ID to new category ID
  const oldToNewCategoryId = {};

  for (const oldCat of existingCategories) {
    const oldSlug = oldCat.slug?.current || normalizeSlug(oldCat.name);
    const newSlug = CATEGORY_MAPPING[oldSlug];

    if (newSlug && categoryIdMap[newSlug]) {
      oldToNewCategoryId[oldCat._id] = categoryIdMap[newSlug];
    }
  }

  for (const company of companies) {
    const oldCatId = company.categoryId;
    const oldCatSlug = company.categorySlug || normalizeSlug(company.categoryName || '');
    const newSlug = CATEGORY_MAPPING[oldCatSlug];

    if (!newSlug) {
      log(`Company "${company.name}": Unknown category "${oldCatSlug}"`, 'warning');
      results.errors.push({ type: 'unknown_category', company: company.name, oldCategory: oldCatSlug });
      continue;
    }

    const newCatId = categoryIdMap[newSlug];

    if (!newCatId) {
      log(`Company "${company.name}": New category ID not found for "${newSlug}"`, 'error');
      results.errors.push({ type: 'missing_new_category', company: company.name, newSlug });
      continue;
    }

    if (oldCatId === newCatId) {
      log(`Company "${company.name}": Already in correct category`);
      continue;
    }

    log(`Company "${company.name}": ${oldCatSlug} → ${newSlug}`, 'success');

    if (!DRY_RUN) {
      await client.patch(company._id)
        .set({ category: { _type: 'reference', _ref: newCatId } })
        .commit();
    }

    results.companiesReassigned.push({
      name: company.name,
      from: oldCatSlug,
      to: newSlug,
    });
  }
}

// ============ STEP 4: UPDATE SECTORS ============
async function updateSectors(sectors, categoryIdMap, existingCategories) {
  log('\n--- Updating Sector References ---');

  for (const sector of sectors) {
    const oldCatSlug = sector.categorySlug || normalizeSlug(sector.categoryName || '');
    const newSlug = CATEGORY_MAPPING[oldCatSlug];

    if (!newSlug) {
      log(`Sector "${sector.name}": Unknown category "${oldCatSlug}"`, 'warning');
      continue;
    }

    const newCatId = categoryIdMap[newSlug];

    if (!newCatId) {
      log(`Sector "${sector.name}": New category ID not found for "${newSlug}"`, 'error');
      continue;
    }

    if (sector.categoryId === newCatId) {
      log(`Sector "${sector.name}": Already linked to correct category`);
      continue;
    }

    log(`Sector "${sector.name}": Updating category reference → ${newSlug}`, 'success');

    if (!DRY_RUN) {
      await client.patch(sector._id)
        .set({ category: { _type: 'reference', _ref: newCatId } })
        .commit();
    }

    results.sectorsUpdated.push({
      name: sector.name,
      from: oldCatSlug,
      to: newSlug,
    });
  }
}

// ============ STEP 5: IDENTIFY OLD CATEGORIES TO DELETE ============
function identifyOldCategories(existingCategories) {
  log('\n--- Identifying Old Categories for Deletion ---');

  const newSlugs = NEW_CATEGORIES.map(c => c.slug);

  for (const cat of existingCategories) {
    const slug = cat.slug?.current || normalizeSlug(cat.name);
    if (!newSlugs.includes(slug)) {
      log(`Old category to delete: "${cat.name}" (${slug})`, 'warning');
      results.oldCategoriesToDelete.push({ name: cat.name, slug, id: cat._id });
    }
  }
}

// ============ STEP 6: VERIFY MIGRATION ============
async function verifyMigration() {
  if (DRY_RUN) {
    log('\n--- Skipping verification (dry-run mode) ---');
    return;
  }

  log('\n--- Verifying Migration ---');

  const [categories, companies] = await Promise.all([
    client.fetch(`*[_type == "category" && published == true]{_id, name, slug}`),
    client.fetch(`*[_type == "company"]{_id, name, "categoryName": category->name, "categorySlug": category->slug.current}`),
  ]);

  log(`Active categories: ${categories.length}`);
  categories.forEach(c => log(`  - ${c.name} (${c.slug?.current})`));

  // Check for orphaned companies
  const orphaned = companies.filter(c => !c.categoryName);
  if (orphaned.length > 0) {
    log(`\n⚠️ Companies without category:`, 'warning');
    orphaned.forEach(c => log(`  - ${c.name}`));
  } else {
    log('All companies have valid category references', 'success');
  }
}

// ============ MAIN ============
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(DRY_RUN ? '🔍 DRY RUN MODE - No changes will be made' : '🚀 EXECUTING MIGRATION');
  console.log('='.repeat(60) + '\n');

  if (!config.token) {
    log('ERROR: SANITY_API_TOKEN not found in environment variables', 'error');
    log('Please set SANITY_API_TOKEN in .env.local or environment', 'error');
    process.exit(1);
  }

  try {
    // Step 1: Fetch current state
    const { categories, companies, sectors } = await fetchCurrentState();

    // Step 2: Create/update new categories
    const categoryIdMap = await createOrUpdateCategories(categories);

    // Step 3: Reassign companies
    await reassignCompanies(companies, categoryIdMap, categories);

    // Step 4: Update sectors
    await updateSectors(sectors, categoryIdMap, categories);

    // Step 5: Identify old categories
    identifyOldCategories(categories);

    // Step 6: Verify migration
    await verifyMigration();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nCategories created: ${results.categoriesCreated.length}`);
    results.categoriesCreated.forEach(c => console.log(`  ✅ ${c.name}`));

    console.log(`\nCategories updated: ${results.categoriesUpdated.length}`);
    results.categoriesUpdated.forEach(c => console.log(`  📝 ${c.name}`));

    console.log(`\nCompanies reassigned: ${results.companiesReassigned.length}`);
    results.companiesReassigned.forEach(c => console.log(`  🔄 ${c.name}: ${c.from} → ${c.to}`));

    console.log(`\nSectors updated: ${results.sectorsUpdated.length}`);
    results.sectorsUpdated.forEach(s => console.log(`  🔄 ${s.name}: ${s.from} → ${s.to}`));

    console.log(`\nOld categories to delete manually: ${results.oldCategoriesToDelete.length}`);
    results.oldCategoriesToDelete.forEach(c => console.log(`  ⚠️ ${c.name} (ID: ${c.id})`));

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors: ${results.errors.length}`);
      results.errors.forEach(e => console.log(`  - ${JSON.stringify(e)}`));
    }

    console.log('\n' + '='.repeat(60));
    if (DRY_RUN) {
      console.log('✨ Dry run complete. Run without --dry-run to execute migration.');
    } else {
      console.log('✨ Migration complete!');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
