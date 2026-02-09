/**
 * MIGRATION NOTES - Investment Rounds Unification
 * ================================================
 *
 * As of Feb 2026, investment rounds have been unified into a single `investmentRounds` array.
 * The old separate fields (fundingRound, investmentDate, yaliInvestmentAmount, etc.) are now
 * deprecated and moved to the "Legacy Fields" tab.
 *
 * TO MIGRATE EXISTING DATA:
 * 1. For each company, go to the "Investment Rounds" tab
 * 2. Add the initial investment as the first round:
 *    - Check "Initial Round" toggle
 *    - Fill in Round Name (e.g., "Series A")
 *    - Fill in Investment Date (copy from legacy field)
 *    - Fill in Yali's Investment amount (copy from legacy field)
 *    - Fill in ownership, valuations, co-investors as needed
 * 3. Add any follow-on rounds in order
 * 4. The "Legacy Fields" tab shows the old data for reference
 *
 * DISPLAY BEHAVIOR:
 * - The portal will use investmentRounds array if populated
 * - Falls back to legacy fields if investmentRounds is empty
 * - "Latest funding round" = most recent round by date
 * - "Total investment" = sum of all rounds' yaliInvestment
 * - "Ownership" = from latest round's yaliOwnership
 */

export default {
  name: 'company',
  title: 'Portfolio Company',
  type: 'document',

  groups: [
    { name: 'basic', title: 'Basic Info', default: true },
    { name: 'rounds', title: 'Investment Rounds' },
    { name: 'quarterly', title: 'Quarterly Performance' },
    { name: 'team', title: 'Team & Founders' },
    { name: 'story', title: 'Investment Story' },
    { name: 'legacy', title: 'Legacy Fields (Deprecated)' },
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
    {
      name: 'showOnMainWebsite',
      title: 'Show on Main Website',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle off to hide from the public website while keeping in LP reports',
      group: 'basic',
    },
    {
      name: 'aboutCompany',
      title: 'About the Company',
      type: 'text',
      rows: 6,
      description: 'For LP reports only; will not be shown on main website',
      group: 'basic',
    },
    {
      name: 'isRevenueMaking',
      title: 'Revenue Making',
      type: 'boolean',
      initialValue: false,
      description: 'Toggle off for pre-revenue companies. Revenue and PAT fields will be greyed out in quarterly updates.',
      group: 'basic',
    },

    // ===== LEGACY INVESTMENT DETAILS (Deprecated - use Investment Rounds instead) =====
    {
      name: 'investmentDate',
      title: '[Legacy] Date of First Investment',
      type: 'date',
      group: 'legacy',
      description: '⚠️ DEPRECATED: Use Investment Rounds tab instead. This field is kept for backward compatibility.',
    },
    {
      name: 'fundingRound',
      title: '[Legacy] Funding Round',
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
          { title: 'Bridge Round', value: 'bridge' },
          { title: 'Growth', value: 'growth' },
        ],
      },
      group: 'legacy',
      description: '⚠️ DEPRECATED: Use Investment Rounds tab instead.',
    },
    {
      name: 'yaliInvestmentAmount',
      title: "[Legacy] Yali's Investment Amount (₹ Crores)",
      type: 'number',
      group: 'legacy',
      description: '⚠️ DEPRECATED: Use Investment Rounds tab instead.',
    },
    {
      name: 'yaliOwnershipPercent',
      title: "[Legacy] Yali's Ownership (%)",
      type: 'number',
      group: 'legacy',
      description: '⚠️ DEPRECATED: Use Investment Rounds tab instead.',
    },

    // ===== INVESTMENT ROUNDS (Single source of truth) =====
    {
      name: 'investmentRounds',
      title: 'Investment Rounds',
      type: 'array',
      group: 'rounds',
      description: 'Add ALL investment rounds here including the initial round. Mark the first investment with "Initial Round" toggle. Rounds are displayed chronologically by date.',
      of: [
        {
          type: 'object',
          name: 'investmentRound',
          title: 'Investment Round',
          fields: [
            {
              name: 'isInitialRound',
              title: 'Initial Round',
              type: 'boolean',
              initialValue: false,
              description: 'Check this for the first investment round (only one round should have this checked)',
            },
            {
              name: 'roundName',
              title: 'Round Name',
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
                  { title: 'Bridge Round', value: 'bridge' },
                  { title: 'CCD Conversion', value: 'ccd-conversion' },
                  { title: 'Follow-on', value: 'follow-on' },
                  { title: 'Growth', value: 'growth' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'roundLabel',
              title: 'Custom Round Label (Optional)',
              type: 'string',
              description: 'e.g., "Bridge round in Nov 2025" - if left blank, Round Name will be used',
            },
            {
              name: 'investmentDate',
              title: 'Investment Date',
              type: 'date',
              validation: (Rule) => Rule.required(),
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
              title: "Yali's Ownership % (after this round)",
              type: 'number',
              description: 'Fully diluted ownership percentage after this round',
            },
            {
              name: 'moicForRound',
              title: 'MOIC for this Round',
              type: 'number',
              description: 'Multiple on invested capital specific to this round',
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
              label: 'roundLabel',
              date: 'investmentDate',
              investment: 'yaliInvestment',
              isInitial: 'isInitialRound',
            },
            prepare({ title, label, date, investment, isInitial }) {
              const roundLabel = label || (title ? title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Round');
              const prefix = isInitial ? '⭐ ' : '';
              return {
                title: `${prefix}${roundLabel}`,
                subtitle: `${date ? new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''} ${investment ? `• ₹${investment} Cr` : ''}`.trim(),
              };
            },
          },
        },
      ],
    },

    // ===== INVESTMENT STATUS & LEAD INVESTOR =====
    {
      name: 'leadInvestor',
      title: 'Yali is Lead Investor?',
      type: 'boolean',
      initialValue: false,
      group: 'rounds',
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
      group: 'rounds',
    },

    // ===== LEGACY FIRST ROUND ECONOMICS (Deprecated) =====
    {
      name: 'preMoneyValuation',
      title: '[Legacy] Pre-Money Valuation (₹ Crores)',
      type: 'number',
      group: 'legacy',
      description: '⚠️ DEPRECATED: Use Investment Rounds tab instead.',
    },
    {
      name: 'totalRoundSize',
      title: '[Legacy] Total Round Size (₹ Crores)',
      type: 'number',
      group: 'legacy',
      description: '⚠️ DEPRECATED: Use Investment Rounds tab instead.',
    },
    {
      name: 'postMoneyValuation',
      title: '[Legacy] Post-Money Valuation (₹ Crores)',
      type: 'number',
      group: 'legacy',
      description: '⚠️ DEPRECATED: Use Investment Rounds tab instead.',
    },
    {
      name: 'coInvestors',
      title: '[Legacy] Co-Investors (First Round)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'legacy',
      description: '⚠️ DEPRECATED: Use Investment Rounds tab instead.',
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
              description: 'Financial year ending March of this year',
              options: {
                list: Array.from({ length: 12 }, (_, i) => {
                  const year = 2024 + i;
                  return { title: `FY${String(year).slice(2)} (Apr ${year - 1} – Mar ${year})`, value: `FY${String(year).slice(2)}` };
                }),
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
              readOnly: ({ document }) => !document?.isRevenueMaking,
            },
            {
              name: 'patINR',
              title: 'Profit After Tax (₹ Crores)',
              type: 'number',
              description: 'Use negative for losses',
              readOnly: ({ document }) => !document?.isRevenueMaking,
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
              type: 'array',
              of: [
                {
                  type: 'block',
                  styles: [
                    { title: 'Normal', value: 'normal' },
                    { title: 'Heading', value: 'h3' },
                    { title: 'Subheading', value: 'h4' },
                  ],
                  lists: [
                    { title: 'Bullet', value: 'bullet' },
                    { title: 'Numbered', value: 'number' },
                  ],
                  marks: {
                    decorators: [
                      { title: 'Bold', value: 'strong' },
                      { title: 'Italic', value: 'em' },
                    ],
                    annotations: [
                      {
                        name: 'link',
                        type: 'object',
                        title: 'URL',
                        fields: [
                          {
                            name: 'href',
                            type: 'url',
                            title: 'URL',
                            validation: (Rule) => Rule.uri({
                              scheme: ['http', 'https', 'mailto', 'tel'],
                            }),
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              description: 'Detailed narrative update for this quarter (supports headings, lists, and links)',
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
