import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // Need write token for mutations
});

async function seedLPReport() {
  console.log('Fetching existing companies...');

  // Get existing companies
  const companies = await client.fetch('*[_type == "company"]{_id, name}');
  console.log('Found companies:', companies.map(c => c.name));

  // Get team member for signatory (Mathew Cyriac or similar)
  const teamMembers = await client.fetch('*[_type == "teamMember"]{_id, name, role}');
  console.log('Found team members:', teamMembers.map(t => `${t.name} (${t.role})`));

  // Find Managing Partner or senior person
  const managingPartner = teamMembers.find(t =>
    t.role?.toLowerCase().includes('investments') ||
    t.role?.toLowerCase().includes('partner')
  ) || teamMembers[0];

  console.log('Using signatory:', managingPartner?.name);

  // Create the quarterly report document
  const quarterlyReport = {
    _type: 'quarterlyReport',
    title: 'Q2 FY26',
    slug: {
      _type: 'slug',
      current: 'q2-fy26'
    },
    quarter: 'Q2',
    fiscalYear: 'FY26',
    publishedAt: new Date('2024-10-15').toISOString(),
    summary: 'Strong quarter with portfolio NAV growth and new investment deployment in deep tech sectors.',
    highlights: [
      'Portfolio NAV increased by 12% quarter-over-quarter',
      'Two portfolio companies completed follow-on funding rounds',
      'One new investment deployed in the semiconductor space',
      'Strong pipeline of 15+ opportunities under active evaluation'
    ],
    isPublished: true,
    order: 1,

    // Cover Note
    coverNote: {
      greeting: 'Dear Partners,',
      paragraphs: [
        'We are pleased to present the quarterly report for the Yali Capital Deep Tech Fund for the period ending September 2024.',
        'This quarter marked significant progress across our portfolio companies, with several key milestones achieved in product development, customer acquisition, and funding rounds.',
        'The Indian deep tech ecosystem continues to show remarkable resilience and growth, with increasing enterprise adoption of AI and advanced technologies across sectors.'
      ],
      signatoryName: managingPartner?.name || 'Mathew Cyriac',
      signatoryTitle: 'Managing Partner'
    },

    // Fund Summary
    fundSummary: {
      targetCorpus: '₹300 Cr',
      capitalRaised: '₹225 Cr',
      capitalDeployed: '₹85 Cr',
      navPerUnit: '₹1.12',
      irr: '18.5%',
      moic: '1.15x'
    },

    // Portfolio Data - using actual company references
    portfolioData: companies.map((company, index) => ({
      _key: `portfolio-${index}`,
      company: {
        _type: 'reference',
        _ref: company._id
      },
      dateOfFirstInvestment: new Date(2023, 3 + index * 2, 15).toISOString().split('T')[0],
      fundingRound: ['Seed', 'Pre-Series A', 'Series A', 'Seed'][index % 4],
      totalAmountInvested: [8, 12, 15, 10][index % 4],
      ownershipFullyDiluted: [12.5, 8.2, 6.5, 11.0][index % 4],
      fmv: [67, 142, 185, 91][index % 4],
      amountReturnedToInvestors: '-',
      multipleOfInvestment: [0.84, 1.18, 1.23, 0.91][index % 4],
      keyCoInvestors: [
        ['Peak XV', 'Accel'],
        ['Sequoia', 'Matrix Partners'],
        ['Lightspeed', 'General Catalyst'],
        ['Kalaari', 'Blume']
      ][index % 4]
    })),

    // Media Coverage
    mediaCoverage: [
      {
        _key: 'media-1',
        date: '2024-09-15',
        title: 'Yali Capital leads funding round in C2i Semiconductors',
        url: 'https://example.com/news-1'
      },
      {
        _key: 'media-2',
        date: '2024-09-01',
        title: 'Deep Tech funding in India reaches record high in Q2',
        url: 'https://example.com/news-2'
      },
      {
        _key: 'media-3',
        date: '2024-08-20',
        title: '4baseCare expands genomics platform to Southeast Asia',
        url: 'https://example.com/news-3'
      },
      {
        _key: 'media-4',
        date: '2024-08-05',
        title: 'Perceptyne Robotics signs enterprise deal with manufacturing giant',
        url: 'https://example.com/news-4'
      }
    ],

    // Contact Info
    contactInfo: {
      newsroomUrl: 'https://yali.vc/newsroom',
      irEmail: 'investor.relations@yali.vc'
    }
  };

  console.log('\nCreating quarterly report...');
  console.log(JSON.stringify(quarterlyReport, null, 2));

  // Check if we have write token
  if (!process.env.SANITY_WRITE_TOKEN) {
    console.log('\n⚠️  No SANITY_WRITE_TOKEN found. Run with:');
    console.log('SANITY_WRITE_TOKEN=your-token node scripts/seed-lp-report.mjs');
    console.log('\nOr create the document manually in Sanity Studio.');
    return;
  }

  try {
    const result = await client.create(quarterlyReport);
    console.log('\n✓ Created quarterly report:', result._id);
  } catch (error) {
    console.error('Error creating report:', error.message);
  }
}

seedLPReport().catch(console.error);
