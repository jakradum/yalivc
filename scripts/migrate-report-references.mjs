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

async function migrateReportReferences() {
  console.log('🔄 Starting migration of quarterly report references...\n');

  try {
    // 1. Fetch all lpQuarterlyReport documents
    const reports = await client.fetch(`
      *[_type == "lpQuarterlyReport"]{
        _id,
        title,
        quarter,
        fiscalYear,
        "companyUpdates": portfolioCompanyUpdates[]->{
          _id,
          "investmentId": investment._ref
        }
      }
    `);

    console.log(`✅ Found ${reports.length} quarterly report documents\n`);

    // 2. Build transactions to update each report
    const transactions = [];

    for (const report of reports) {
      if (!report.companyUpdates || report.companyUpdates.length === 0) {
        console.log(`  ⏭️  Skipping ${report.title} - no portfolio updates`);
        continue;
      }

      // Extract unique investment IDs
      const investmentIds = [...new Set(
        report.companyUpdates
          .map(u => u.investmentId)
          .filter(Boolean)
      )];

      if (investmentIds.length === 0) {
        console.warn(`  ⚠️  Warning: ${report.title} has no valid investment references`);
        continue;
      }

      console.log(`  Migrating ${report.title}: ${investmentIds.length} companies`);

      // Convert to references
      const portfolioCompanies = investmentIds.map(id => ({
        _type: 'reference',
        _ref: id,
        _key: id
      }));

      transactions.push({
        patch: {
          id: report._id,
          set: {
            portfolioCompanies
          }
        }
      });
    }

    if (transactions.length === 0) {
      console.log('\n⚠️  No reports to migrate');
      return;
    }

    console.log(`\n🚀 Applying ${transactions.length} updates to lpQuarterlyReport documents...\n`);

    // Execute all patches in a transaction
    const result = await client.transaction(transactions).commit();

    console.log('✅ Migration completed successfully!\n');
    console.log(`📈 Summary:`);
    console.log(`   - ${transactions.length} quarterly reports updated`);
    console.log(`   - Old portfolioCompanyUpdates field is still present (not removed)`);
    console.log('\n💡 TIP: After verifying everything works, you can remove the portfolioCompanyUpdates field from the lpQuarterlyReport schema');
    console.log('💡 TIP: You can also delete the old lpCompanyQuarterUpdate documents from Sanity');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateReportReferences()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
