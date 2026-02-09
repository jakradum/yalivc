/**
 * Portfolio Company Schema
 *
 * Investment data is managed entirely through the `investmentRounds` array.
 * Each round tracks its own economics, co-investors, and whether Yali led.
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
  ],

  fields: [
    // ===== BASIC INFO =====
    {
      name: 'name',
      title: 'Company Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: 'basic',
      description: 'Display name for the main website',
    },
    {
      name: 'entityName',
      title: 'Entity Name (for LP Reports)',
      type: 'string',
      group: 'basic',
      description: 'Legal/formal entity name for LP reports. If blank, Company Name is used.',
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
              name: 'isYaliLead',
              title: 'Yali Led This Round',
              type: 'boolean',
              initialValue: false,
              description: 'Check if Yali was the lead investor for this specific round',
            },
            {
              name: 'showEarlyInReport',
              title: 'Show in Current Report (Override)',
              type: 'boolean',
              initialValue: false,
              description: 'Check to show this round in reports even if the investment date is after the quarter end (useful for in-progress rounds)',
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
              name: 'coInvestors',
              title: 'Co-Investors in this Round',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'investor' }] }],
              description: 'Select co-investors from the centralized investor list',
            },
          ],
          preview: {
            select: {
              title: 'roundName',
              label: 'roundLabel',
              date: 'investmentDate',
              investment: 'yaliInvestment',
              isInitial: 'isInitialRound',
              isLead: 'isYaliLead',
            },
            prepare({ title, label, date, investment, isInitial, isLead }) {
              const roundLabel = label || (title ? title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Round');
              const prefix = isInitial ? '⭐ ' : '';
              const leadBadge = isLead ? ' (Lead)' : '';
              return {
                title: `${prefix}${roundLabel}${leadBadge}`,
                subtitle: `${date ? new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''} ${investment ? `• ₹${investment} Cr` : ''}`.trim(),
              };
            },
          },
        },
      ],
    },

    // ===== INVESTMENT STATUS =====
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
              title: 'Cumulative MOIC',
              type: 'number',
              description: 'Cumulative multiple across all rounds = (FMV + Amount Returned) / Total Investment',
            },
            {
              name: 'roundMoics',
              title: 'Per-Round MOICs',
              type: 'array',
              description: 'Track MOIC for each investment round separately (only needed if multiple rounds)',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'roundName',
                      title: 'Round',
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
                      name: 'moic',
                      title: 'MOIC',
                      type: 'number',
                      validation: (Rule) => Rule.required(),
                    },
                  ],
                  preview: {
                    select: {
                      round: 'roundName',
                      moic: 'moic',
                    },
                    prepare({ round, moic }) {
                      const roundLabel = round ? round.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Round';
                      return {
                        title: `${roundLabel}: ${moic ? moic.toFixed(2) + 'x' : '-'}`,
                      };
                    },
                  },
                },
              ],
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
            // Table Footnotes
            {
              name: 'tableFootnotes',
              title: 'Investment Table Footnotes',
              type: 'array',
              description: 'Add footnotes for the investment round details table (e.g., valuation methodology notes)',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'marker',
                      title: 'Marker',
                      type: 'string',
                      description: 'e.g., "*", "†", "1", "2"',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'text',
                      title: 'Footnote Text',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                  ],
                  preview: {
                    select: {
                      marker: 'marker',
                      text: 'text',
                    },
                    prepare({ marker, text }) {
                      return {
                        title: `${marker} ${text}`,
                      };
                    },
                  },
                },
              ],
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
