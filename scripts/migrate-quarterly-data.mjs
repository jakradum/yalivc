import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false
});

async function migrateQuarterlyData() {
  console.log('🔄 Starting migration of quarterly update data...\n');

  try {
    // 1. Fetch all lpCompanyQuarterUpdate documents
    const quarterUpdates = await client.fetch(`
      *[_type == "lpCompanyQuarterUpdate"]{
        _id,
        quarter,
        fiscalYear,
        currentFMV,
        currentOwnershipPercent,
        amountReturned,
        multipleOfInvestment,
        revenueINR,
        patINR,
        teamSize,
        keyMetrics,
        updates,
        "investmentId": investment._ref
      }
    `);

    console.log(`✅ Found ${quarterUpdates.length} quarterly update records\n`);

    // 2. Group updates by investment
    const updatesByInvestment = {};
    quarterUpdates.forEach(update => {
      if (!update.investmentId) {
        console.warn(`⚠️  Skipping update ${update._id} - no investment reference`);
        return;
      }

      if (!updatesByInvestment[update.investmentId]) {
        updatesByInvestment[update.investmentId] = [];
      }

      updatesByInvestment[update.investmentId].push({
        quarter: update.quarter,
        fiscalYear: update.fiscalYear,
        currentFMV: update.currentFMV,
        currentOwnershipPercent: update.currentOwnershipPercent,
        amountReturned: update.amountReturned,
        multipleOfInvestment: update.multipleOfInvestment,
        revenueINR: update.revenueINR,
        patINR: update.patINR,
        teamSize: update.teamSize,
        keyMetrics: update.keyMetrics || [],
        updates: update.updates || []
      });
    });

    console.log(`📊 Updates grouped into ${Object.keys(updatesByInvestment).length} investments\n`);

    // 3. Update each lpInvestment with its quarterly data
    const transactions = [];

    for (const [investmentId, quarters] of Object.entries(updatesByInvestment)) {
      console.log(`  Preparing ${quarters.length} quarters for investment ${investmentId}`);

      transactions.push({
        patch: {
          id: investmentId,
          set: {
            quarterlyUpdates: quarters
          }
        }
      });
    }

    if (transactions.length === 0) {
      console.log('\n⚠️  No updates to migrate');
      return;
    }

    console.log(`\n🚀 Applying ${transactions.length} updates to lpInvestment documents...\n`);

    // Execute all patches in a transaction
    const result = await client.transaction(transactions).commit();

    console.log('✅ Migration completed successfully!\n');
    console.log(`📈 Summary:`);
    console.log(`   - ${quarterUpdates.length} quarterly updates migrated`);
    console.log(`   - ${transactions.length} investment records updated`);
    console.log('\n⚠️  IMPORTANT: You should now update lpQuarterlyReport documents to use the new portfolioCompanies field instead of portfolioCompanyUpdates');
    console.log('\n💡 TIP: The old lpCompanyQuarterUpdate documents are still in Sanity. After verifying the migration worked, you can delete them.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateQuarterlyData()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
