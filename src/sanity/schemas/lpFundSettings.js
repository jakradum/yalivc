export default {
  name: 'lpFundSettings',
  title: 'LP Fund Settings',
  type: 'document',

  groups: [
    { name: 'identity', title: 'Fund Identity' },
    { name: 'fundSize', title: 'Fund Size & Capital' },
    { name: 'dates', title: 'Key Dates' },
    { name: 'quarterly', title: 'Quarterly Performance' },
    { name: 'strategy', title: 'Strategy' },
    { name: 'contacts', title: 'Contacts' },
    { name: 'branding', title: 'Branding' },
  ],

  fields: [
    // IDENTITY
    {
      name: 'fundName',
      title: 'Fund Name',
      type: 'string',
      description: 'e.g., "Yali Deeptech Fund I"',
      group: 'identity',
      validation: Rule => Rule.required()
    },
    {
      name: 'fundManagerName',
      title: 'Fund Manager Entity',
      type: 'string',
      description: 'e.g., "Yali Partners LLP"',
      group: 'identity'
    },
    {
      name: 'fundManagerDescriptor',
      title: 'Fund Manager Descriptor',
      type: 'string',
      description: 'e.g., "Investment manager - Deep tech focus"',
      group: 'identity'
    },
    {
      name: 'tagline',
      title: 'Fund Tagline',
      type: 'string',
      description: 'e.g., "Taking India\'s Deep Tech to new heights"',
      group: 'identity'
    },

    // KEY DATES
    {
      name: 'firstCloseDate',
      title: 'First Close Date',
      type: 'date',
      group: 'dates'
    },
    {
      name: 'finalCloseDate',
      title: 'Final Close Date',
      type: 'date',
      group: 'dates'
    },

    // FUND SIZE & CAPITAL (Static values set at close)
    {
      name: 'fundSizeAtClose',
      title: 'Fund Size at Final Close (₹ Crores)',
      type: 'number',
      description: 'Total committed capital at final close',
      group: 'fundSize'
    },
    {
      name: 'targetFundSizeINR',
      title: 'Target Fund Size (₹ Crores)',
      type: 'number',
      group: 'fundSize'
    },
    {
      name: 'targetFundSizeUSD',
      title: 'Target Fund Size ($ Million)',
      type: 'number',
      group: 'fundSize'
    },
    // ===== QUARTERLY PERFORMANCE =====
    {
      name: 'quarterlyPerformance',
      title: 'Quarterly Fund Performance',
      type: 'array',
      group: 'quarterly',
      description: 'Track fund performance metrics by quarter. Add a new entry each quarter.',
      of: [
        {
          type: 'object',
          name: 'quarterPerformance',
          title: 'Quarter Performance',
          fields: [
            {
              name: 'quarter',
              title: 'Quarter',
              type: 'string',
              options: {
                list: ['Q1', 'Q2', 'Q3', 'Q4'],
              },
              validation: Rule => Rule.required(),
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
              validation: Rule => Rule.required(),
            },
            {
              name: 'amountDrawnDown',
              title: 'Amount Drawn Down (₹ Crores)',
              type: 'number',
              description: 'Total capital drawn from LPs as of this quarter',
            },
            {
              name: 'totalInvested',
              title: 'Total Invested in Portfolio (₹ Crores)',
              type: 'number',
              description: 'Capital deployed into companies as of this quarter',
            },
            {
              name: 'fairMarketValue',
              title: 'Fair Market Value (₹ Crores)',
              type: 'number',
              description: 'FMV including realised value as of quarter end',
            },
            {
              name: 'amountReturned',
              title: 'Amount Returned (₹ Crores)',
              type: 'number',
              description: 'Including passive income returned',
            },
            {
              name: 'moic',
              title: 'MOIC',
              type: 'number',
              description: 'Multiple on Invested Capital',
            },
            {
              name: 'tvpi',
              title: 'TVPI',
              type: 'number',
              description: 'Total Value to Paid-In',
            },
            {
              name: 'dpi',
              title: 'DPI',
              type: 'number',
              description: 'Distributions to Paid-In',
            },
          ],
          preview: {
            select: {
              quarter: 'quarter',
              year: 'fiscalYear',
              fmv: 'fairMarketValue',
              moic: 'moic',
            },
            prepare({ quarter, year, fmv, moic }) {
              const metrics = [];
              if (fmv) metrics.push(`FMV: ₹${fmv} Cr`);
              if (moic) metrics.push(`MOIC: ${moic.toFixed(2)}x`);
              return {
                title: `${quarter} ${year}`,
                subtitle: metrics.join(' • ') || 'No data',
              };
            },
          },
        },
      ],
    },

    // STRATEGY
    {
      name: 'investmentStrategy',
      title: 'Investment Strategy',
      type: 'text',
      description: 'Brief description of fund strategy for cover notes',
      group: 'strategy'
    },
    {
      name: 'focusSectors',
      title: 'Focus Sectors',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      group: 'strategy'
    },

    // CONTACTS
    {
      name: 'investorRelationsEmail',
      title: 'Investor Relations Email',
      type: 'email',
      description: 'Primary IR contact (will be clickable mailto link)',
      group: 'contacts'
    },
    {
      name: 'additionalContacts',
      title: 'Additional Contacts',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'name', title: 'Name', type: 'string' },
          { name: 'email', title: 'Email', type: 'email' },
          { name: 'role', title: 'Role', type: 'string' }
        ],
        preview: {
          select: {
            title: 'name',
            subtitle: 'email'
          }
        }
      }],
      group: 'contacts',
      description: 'Additional team contacts for LP inquiries'
    },
    {
      name: 'website',
      title: 'Website',
      type: 'url',
      group: 'contacts'
    },

    // BRANDING
    {
      name: 'logoLight',
      title: 'Logo (for dark backgrounds)',
      type: 'image',
      group: 'branding'
    },
    {
      name: 'logoDark',
      title: 'Logo (for light backgrounds)',
      type: 'image',
      group: 'branding'
    }
  ],

  preview: {
    select: {
      title: 'fundName'
    },
    prepare({ title }) {
      return {
        title: title || 'Fund Settings',
        subtitle: 'Singleton'
      }
    }
  }
}
