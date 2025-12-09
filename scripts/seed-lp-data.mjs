#!/usr/bin/env node

/**
 * Seed LP Portal data for testing
 *
 * Usage: node scripts/seed-lp-data.mjs
 *
 * This script creates:
 * - Fund Settings (singleton)
 * - LP Investments for existing companies
 * - Company Quarter Updates
 * - Pipeline Deals
 * - A sample LP Quarterly Report
 */

import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

// Try SANITY_WRITE_TOKEN first, fall back to SANITY_API_TOKEN
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: token,
  useCdn: false,
});

async function main() {
  console.log('🚀 Starting LP data seed...\n');

  // Check if we have a write token
  if (!token) {
    console.error('❌ Error: SANITY_WRITE_TOKEN or SANITY_API_TOKEN environment variable is required');
    console.log('\nTo get a token:');
    console.log('1. Go to https://www.sanity.io/manage/project/nt0wmty3/api');
    console.log('2. Create a new token with "Editor" permissions');
    console.log('3. Run: SANITY_API_TOKEN=your_token node scripts/seed-lp-data.mjs');
    process.exit(1);
  }

  try {
    // 1. Get existing companies
    console.log('📦 Fetching existing companies...');
    const companies = await client.fetch(`*[_type == "company"] | order(order asc) {
      _id,
      name,
      "slug": slug.current
    }`);
    console.log(`   Found ${companies.length} companies\n`);

    if (companies.length === 0) {
      console.error('❌ No companies found. Please add companies first.');
      process.exit(1);
    }

    // 1b. Get a team member for signatory (prefer one with 'Partner' in role)
    console.log('👤 Fetching team member for signatory...');
    const teamMembers = await client.fetch(`*[_type == "teamMember"] | order(order asc) {
      _id,
      name,
      role
    }`);
    const signatoryMember = teamMembers.find(t =>
      t.role?.toLowerCase().includes('partner') ||
      t.role?.toLowerCase().includes('investments')
    ) || teamMembers[0];

    if (signatoryMember) {
      console.log(`   Found signatory: ${signatoryMember.name} (${signatoryMember.role})\n`);
    } else {
      console.log('   ⚠️ No team member found - signatory will be empty\n');
    }

    // 2. Create Fund Settings
    console.log('⚙️  Creating Fund Settings...');
    const fundSettings = await client.createOrReplace({
      _id: 'lpFundSettings',
      _type: 'lpFundSettings',
      fundName: 'Yali Deeptech Fund I',
      fundManagerName: 'Yali Partners LLP',
      fundManagerDescriptor: 'Investment manager - Deep tech focus',
      tagline: "Taking India's Deep Tech to new heights",
      firstCloseDate: '2024-01-29',
      finalCloseDate: '2025-07-25',
      targetFundSizeINR: 810,
      targetFundSizeUSD: 97,
      investmentStrategy: 'Yali Capital invests in deep technology companies across semiconductors, robotics, life sciences, and artificial intelligence sectors in India.',
      investorRelationsEmail: 'investor.relations@yali.vc',
      website: 'https://yali.vc',
    });
    console.log(`   ✓ Fund Settings created\n`);

    // 3. Create LP Investments for each company
    console.log('💰 Creating LP Investments...');
    const investmentData = [
      { companySlug: '4basecare', date: '2024-08-12', round: 'series-a', amount: 5.0, ownership: 15.2, coInvestors: ['Existing Investors'] },
      { companySlug: 'perceptyne-robotics', date: '2024-10-14', round: 'seed', amount: 2.5, ownership: 12.5, coInvestors: ['Endiya Partners', 'Other Angels'] },
      { companySlug: 'c2i', date: '2024-11-08', round: 'seed', amount: 3.3, ownership: 10.8, coInvestors: ['Lip-Bu Tan'] },
      { companySlug: 'pointai', date: '2025-10-30', round: 'seed', amount: 4.4, ownership: 18.0, coInvestors: ['Other Investors'] },
    ];

    const investments = [];
    for (const company of companies) {
      const data = investmentData.find(d => d.companySlug === company.slug) || {
        date: '2024-08-01',
        round: 'seed',
        amount: 2.0,
        ownership: 10.0,
        coInvestors: ['Co-Investor A']
      };

      const investment = await client.create({
        _type: 'lpInvestment',
        company: { _type: 'reference', _ref: company._id },
        investmentDate: data.date,
        fundingRound: data.round,
        yaliInvestmentAmount: data.amount,
        yaliOwnershipPercent: data.ownership,
        coInvestors: data.coInvestors,
        reportDescription: `Investment in ${company.name} - a leading deep technology company.`,
        status: 'active',
        isRevenuePositive: false,
        displayOrder: companies.indexOf(company) + 1,
      });
      investments.push(investment);
      console.log(`   ✓ Investment created for ${company.name}`);
    }
    console.log();

    // 4. Create Company Quarter Updates for Q2 FY26
    console.log('📊 Creating Q2 FY26 Company Updates...');
    const quarterUpdates = [];
    for (let i = 0; i < investments.length; i++) {
      const investment = investments[i];
      const company = companies[i];

      const update = await client.create({
        _type: 'lpCompanyQuarterUpdate',
        investment: { _type: 'reference', _ref: investment._id },
        quarter: 'Q2',
        fiscalYear: 'FY26',
        currentFMV: (2 + Math.random() * 3).toFixed(2) * 1, // Random FMV between 2-5 Cr
        currentOwnershipPercent: investment.yaliOwnershipPercent * (0.9 + Math.random() * 0.1), // Slight dilution
        amountReturned: 0,
        multipleOfInvestment: (1.0 + Math.random() * 0.5).toFixed(2) * 1, // MOIC 1.0-1.5x
        updates: [
          `${company.name} achieved significant milestone in Q2.`,
          'Team expanded with key technical hires.',
          'Customer pipeline grew substantially.',
          'Product development on track for next major release.',
        ],
        revenueINR: null,
        patINR: null,
        teamSize: 15 + Math.floor(Math.random() * 20),
      });
      quarterUpdates.push(update);
      console.log(`   ✓ Q2 FY26 update created for ${company.name}`);
    }
    console.log();

    // 5. Create Pipeline Deals
    console.log('🎯 Creating Pipeline Deals...');
    const pipelineDeals = [
      { name: 'TechCorp AI', sector: 'AI Software Solutions', amount: 5.0, stage: 'due-diligence' },
      { name: 'RoboSense', sector: 'Robotics', amount: 3.0, stage: 'term-sheet' },
      { name: 'BioGenix', sector: 'Life Sciences', amount: 4.0, stage: 'screening' },
    ];

    const createdDeals = [];
    for (const deal of pipelineDeals) {
      const created = await client.create({
        _type: 'lpPipelineDeal',
        companyName: deal.name,
        sectorOverride: deal.sector,
        proposedAmountINR: deal.amount,
        stage: deal.stage,
        description: `${deal.name} is a promising deep-tech startup in the ${deal.sector} space.`,
        isActive: true,
        addedDate: '2025-09-01',
      });
      createdDeals.push(created);
      console.log(`   ✓ Pipeline deal created: ${deal.name}`);
    }
    console.log();

    // 6. Create LP Quarterly Report
    console.log('📝 Creating Q2 FY26 LP Quarterly Report...');
    const report = await client.create({
      _type: 'lpQuarterlyReport',
      title: 'Q2 FY26 Quarterly Report',
      slug: { _type: 'slug', current: 'q2-fy26' },
      quarter: 'Q2',
      fiscalYear: 'FY26',
      reportingDate: '2025-09-30',
      publishDate: new Date().toISOString(),
      fundMetrics: {
        fundSizeAtClose: 893,
        amountDrawnDown: 45,
        totalInvestedInPortfolio: 15.2,
        fmvOfPortfolio: 18.5,
        numberOfPortfolioCompanies: companies.length,
        amountReturned: 0,
        moic: 1.22,
        tvpi: 1.22,
        dpi: 0,
        irr: 18.5,
      },
      coverNoteGreeting: 'Dear Partners,',
      signatory: signatoryMember ? { _type: 'reference', _ref: signatoryMember._id } : undefined,
      portfolioCompanyUpdates: quarterUpdates.map(u => ({ _type: 'reference', _ref: u._id, _key: u._id })),
      pipelineDeals: createdDeals.map(d => ({ _type: 'reference', _ref: d._id, _key: d._id })),
      isPublished: true,
      displayOrder: 1,
    });
    console.log(`   ✓ LP Quarterly Report created: ${report.title}\n`);

    console.log('✅ LP data seed completed successfully!\n');
    console.log('Summary:');
    console.log(`   - Fund Settings: 1`);
    console.log(`   - LP Investments: ${investments.length}`);
    console.log(`   - Quarter Updates: ${quarterUpdates.length}`);
    console.log(`   - Pipeline Deals: ${createdDeals.length}`);
    console.log(`   - LP Reports: 1`);
    console.log('\n🔗 View in Sanity Studio: http://localhost:3000/console');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.statusCode === 403) {
      console.log('\n💡 Token might not have write permissions. Create a new token with "Editor" role.');
    }
    process.exit(1);
  }
}

main();
