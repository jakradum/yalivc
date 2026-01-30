export default {
  name: 'company',
  title: 'Portfolio Company',
  type: 'document',

  groups: [
    { name: 'basic', title: 'Basic Info', default: true },
    { name: 'investment', title: 'Investment Details' },
    { name: 'round', title: 'Follow-on Rounds' },
    { name: 'quarterly', title: 'Quarterly Performance' },
    { name: 'team', title: 'Team & Founders' },
    { name: 'story', title: 'Investment Story' },
  ],

  fields: [
    // ===== BASIC INFO =====
    {
      name: 'name',
      title: 'Company Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: 'basic',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule) => Rule.required(),
      group: 'basic',
    },
    {
      name: 'oneLiner',
      title: 'One-liner',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: 'basic',
    },
    {
      name: 'detail',
      title: 'Detailed Description',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required(),
      group: 'basic',
    },
    {
      name: 'category',
      title: 'Category / Sector',
      type: 'reference',
      to: [{ type: 'category' }],
      group: 'basic',
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
      group: 'basic',
    },
    {
      name: 'link',
      title: 'Website URL',
      type: 'url',
      group: 'basic',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      group: 'basic',
    },

    // ===== INVESTMENT DETAILS =====
    {
      name: 'investmentDate',
      title: 'Date of First Investment',
      type: 'date',
      group: 'investment',
    },
    {
      name: 'fundingRound',
      title: 'Funding Round',
      type: 'string',
      options: {
        list: [
          { title: 'Pre-Seed', value: 'pre-seed' },
          { title: 'Seed', value: 'seed' },
          { title: 'Pre-Series A', value: 'pre-series-a' },
          { title: 'Series A', value: 'series-a' },
          { title: 'Series B', value: 'series-b' },
          { title: 'Series C', value: 'series-c' },
          { title: 'Series D', value: 'series-d' },
          { title: 'Growth', value: 'growth' },
        ],
      },
      group: 'investment',
    },
    {
      name: 'yaliInvestmentAmount',
      title: "Yali's Investment Amount (₹ Crores)",
      type: 'number',
      group: 'investment',
    },
    {
      name: 'yaliOwnershipPercent',
      title: "Yali's Ownership (%)",
      type: 'number',
      description: 'Fully diluted ownership percentage at time of investment',
      group: 'investment',
    },
    {
      name: 'leadInvestor',
      title: 'Yali is Lead Investor?',
      type: 'boolean',
      initialValue: false,
      group: 'investment',
    },
    {
      name: 'investmentStatus',
      title: 'Investment Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Exited', value: 'exited' },
          { title: 'Written Off', value: 'written-off' },
        ],
      },
      initialValue: 'active',
      group: 'investment',
    },

    // ===== INVESTMENT ROUNDS =====
    {
      name: 'investmentRounds',
      title: 'Follow-on Investment Rounds',
      type: 'array',
      group: 'round',
      description: 'Add FOLLOW-ON rounds here. The initial/first round data comes from the "Investment Details" tab and will automatically appear as the first column in the Investment Round Details table on the portal.',
      of: [
        {
          type: 'object',
          name: 'investmentRound',
          title: 'Investment Round',
          fields: [
            {
              name: 'roundName',
              title: 'Round Name',
              type: 'string',
              options: {
                list: [
                  { title: 'Pre-Seed', value: 'pre-seed' },
                  { title: 'Seed', value: 'seed' },
                  { title: 'Series A', value: 'series-a' },
                  { title: 'Series B', value: 'series-b' },
                  { title: 'Series C', value: 'series-c' },
                  { title: 'Series D', value: 'series-d' },
                  { title: 'Bridge', value: 'bridge' },
                  { title: 'Follow-on', value: 'follow-on' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'investmentDate',
              title: 'Investment Date',
              type: 'date',
            },
            {
              name: 'preMoneyValuation',
              title: 'Pre-Money Valuation (₹ Crores)',
              type: 'number',
            },
            {
              name: 'totalRoundSize',
              title: 'Total Round Size (₹ Crores)',
              type: 'number',
            },
            {
              name: 'postMoneyValuation',
              title: 'Post-Money Valuation (₹ Crores)',
              type: 'number',
            },
            {
              name: 'yaliInvestment',
              title: "Yali's Investment (₹ Crores)",
              type: 'number',
            },
            {
              name: 'yaliOwnership',
              title: "Yali's Ownership %",
              type: 'number',
              description: 'Ownership percentage after this round',
            },
            {
              name: 'coInvestors',
              title: 'Co-Investors in this Round',
              type: 'array',
              of: [{ type: 'string' }],
            },
          ],
          preview: {
            select: {
              title: 'roundName',
              date: 'investmentDate',
              investment: 'yaliInvestment',
            },
            prepare({ title, date, investment }) {
              const roundLabel = title ? title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Round';
              return {
                title: roundLabel,
                subtitle: `${date ? new Date(date).getFullYear() : ''} ${investment ? `• ₹${investment} Cr` : ''}`.trim(),
              };
            },
          },
        },
      ],
    },

    // ===== FIRST ROUND ECONOMICS (part of Investment Details) =====
    {
      name: 'preMoneyValuation',
      title: 'Pre-Money Valuation (₹ Crores)',
      type: 'number',
      group: 'investment',
      description: 'Pre-money valuation at first investment',
    },
    {
      name: 'totalRoundSize',
      title: 'Total Round Size (₹ Crores)',
      type: 'number',
      group: 'investment',
      description: 'Total round size at first investment',
    },
    {
      name: 'postMoneyValuation',
      title: 'Post-Money Valuation (₹ Crores)',
      type: 'number',
      group: 'investment',
      description: 'Post-money valuation at first investment',
    },
    {
      name: 'coInvestors',
      title: 'Co-Investors (First Round)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Co-investors in the first round',
      group: 'investment',
    },

    // ===== QUARTERLY PERFORMANCE =====
    {
      name: 'quarterlyUpdates',
      title: 'Quarterly Performance Updates',
      type: 'array',
      group: 'quarterly',
      description: 'Add quarterly performance data for LP reports',
      of: [
        {
          type: 'object',
          name: 'quarterUpdate',
          title: 'Quarter Update',
          fields: [
            {
              name: 'quarter',
              title: 'Quarter',
              type: 'string',
              options: {
                list: ['Q1', 'Q2', 'Q3', 'Q4'],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'fiscalYear',
              title: 'Fiscal Year',
              type: 'string',
              options: {
                list: ['FY24', 'FY25', 'FY26', 'FY27', 'FY28', 'FY29', 'FY30']
              },
              validation: (Rule) => Rule.required(),
            },
            // Valuation & Ownership
            {
              name: 'currentFMV',
              title: 'Fair Market Value (₹ Crores)',
              type: 'number',
              description: 'FMV as of quarter end',
            },
            {
              name: 'currentOwnershipPercent',
              title: 'Current Ownership (%)',
              type: 'number',
              description: 'May change due to dilution',
            },
            {
              name: 'amountReturned',
              title: 'Amount Returned (₹ Crores)',
              type: 'number',
              initialValue: 0,
            },
            {
              name: 'multipleOfInvestment',
              title: 'Multiple of Investment (MOIC)',
              type: 'number',
            },
            // Financials
            {
              name: 'revenueINR',
              title: 'Revenue (₹ Crores)',
              type: 'number',
              description: 'Quarterly revenue',
            },
            {
              name: 'patINR',
              title: 'Profit After Tax (₹ Crores)',
              type: 'number',
              description: 'Use negative for losses',
            },
            {
              name: 'teamSize',
              title: 'Team Size',
              type: 'number',
            },
            // Key Metrics
            {
              name: 'keyMetrics',
              title: 'Key Metrics',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'label', type: 'string', title: 'Metric Name' },
                    { name: 'value', type: 'string', title: 'Value' },
                  ],
                  preview: {
                    select: {
                      title: 'label',
                      subtitle: 'value',
                    },
                  },
                },
              ],
              description: 'Custom metrics like "Order Book", "Customer Pipeline", etc.',
            },
            // Narrative Updates
            {
              name: 'updateNotes',
              title: 'Quarter Update Notes',
              type: 'text',
              rows: 10,
              description: 'Detailed narrative update for this quarter (long form)',
            },
            {
              name: 'highlights',
              title: 'Key Highlights',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Bullet point highlights for this quarter',
            },
          ],
          preview: {
            select: {
              quarter: 'quarter',
              year: 'fiscalYear',
              fmv: 'currentFMV',
              revenue: 'revenueINR',
            },
            prepare({ quarter, year, fmv, revenue }) {
              const metrics = [];
              if (fmv) metrics.push(`FMV: ₹${fmv} Cr`);
              if (revenue) metrics.push(`Rev: ₹${revenue} Cr`);
              return {
                title: `${quarter} ${year}`,
                subtitle: metrics.join(' • ') || 'No financial data',
              };
            },
          },
        },
      ],
    },

    // ===== TEAM & FOUNDERS =====
    {
      name: 'founders',
      title: 'Founders',
      type: 'array',
      group: 'team',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Founder Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'photo',
              title: 'Photo',
              type: 'image',
              options: { hotspot: true },
            },
            {
              name: 'role',
              title: 'Role',
              type: 'string',
            },
            {
              name: 'quote',
              title: 'Quote',
              type: 'text',
              rows: 3,
            },
            {
              name: 'linkedIn',
              title: 'LinkedIn URL',
              type: 'url',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'role',
              media: 'photo',
            },
          },
        },
      ],
    },
    {
      name: 'companyInfo',
      title: 'Company Info',
      type: 'object',
      group: 'team',
      fields: [
        {
          name: 'founded',
          title: 'Founded Year',
          type: 'number',
        },
        {
          name: 'headquarters',
          title: 'Headquarters',
          type: 'string',
        },
      ],
    },

    // ===== INVESTMENT STORY =====
    {
      name: 'story',
      title: 'Investment Story',
      type: 'object',
      group: 'story',
      description: 'Deep dive: why we invested or founder vision',
      fields: [
        {
          name: 'title',
          title: 'Story Title',
          type: 'string',
          placeholder: 'Why we invested in [Company]',
        },
        {
          name: 'author',
          title: 'Author',
          type: 'reference',
          to: [{ type: 'teamMember' }],
          description: 'YALI team member or leave blank for founder',
        },
        {
          name: 'content',
          title: 'Story Content',
          type: 'array',
          of: [
            { type: 'block' },
            {
              type: 'image',
              options: { hotspot: true },
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alt text',
                },
                {
                  name: 'caption',
                  type: 'string',
                  title: 'Caption',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'achievements',
      title: 'Key Achievements',
      type: 'array',
      group: 'story',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'milestone',
              title: 'Milestone',
              type: 'string',
            },
            {
              name: 'date',
              title: 'Date',
              type: 'date',
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
          ],
        },
      ],
    },
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'oneLiner',
      media: 'logo',
    },
  },
};
