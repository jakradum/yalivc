export default {
  name: 'fund2Settings',
  title: 'Fund II Settings',
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
      description: 'e.g., "Yali Deeptech Fund II"',
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
      group: 'identity'
    },
    {
      name: 'collectiveExperience',
      title: 'Collective Deep Tech Experience (years)',
      type: 'number',
      group: 'identity',
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      group: 'identity',
      initialValue: 'Bangalore',
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

    // FUND SIZE & CAPITAL
    {
      name: 'fundSizeAtClose',
      title: 'Fund Size at Final Close (₹ Crores)',
      type: 'number',
      description: 'Leave blank until confirmed — do not estimate',
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
    {
      name: 'greenshoeINR',
      title: 'Greenshoe (₹ Crores)',
      type: 'number',
      group: 'fundSize'
    },
    {
      name: 'fundTerm',
      title: 'Fund Term',
      type: 'string',
      description: 'e.g. "10 + 1 + 1"',
      group: 'fundSize'
    },
    {
      name: 'investmentPeriodYears',
      title: 'Investment Period (Years)',
      type: 'number',
      group: 'fundSize'
    },
    {
      name: 'deploymentStageAllocation',
      title: 'Deployment Stage Allocation',
      type: 'array',
      group: 'fundSize',
      description: 'Powers the deployment-strategy chart — e.g. Seed 10%, Stage Agnostic 90%',
      of: [{
        type: 'object',
        fields: [
          { name: 'stage', title: 'Stage', type: 'string' },
          { name: 'percent', title: 'Percent', type: 'number' },
          { name: 'note', title: 'Note', type: 'string', description: 'e.g. "Initial stage" / "All stages"' },
        ],
        preview: {
          select: { title: 'stage', subtitle: 'percent' },
          prepare({ title, subtitle }) {
            return { title, subtitle: subtitle != null ? `${subtitle}%` : '' };
          },
        },
      }],
    },

    // QUARTERLY PERFORMANCE
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
              options: { list: ['Q1', 'Q2', 'Q3', 'Q4'] },
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
            {
              name: 'rvpi',
              title: 'RVPI',
              type: 'number',
              description: 'Residual Value to Paid-In',
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
      group: 'strategy',
      description: 'Core sectors — reuses the same Category documents as the main site and Fund I'
    },
    {
      name: 'adjacentSectors',
      title: 'Adjacent Sectors',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      group: 'strategy',
      description: 'Fund II-specific: sectors adjacent to the core thesis, shown on the outer ring of the investment-areas diagram. Not present in Fund I.'
    },

    // CONTACTS
    {
      name: 'investorRelationsEmail',
      title: 'Investor Relations Email',
      type: 'email',
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
          select: { title: 'name', subtitle: 'email' }
        }
      }],
      group: 'contacts'
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
        title: title || 'Fund II Settings',
        subtitle: 'Singleton'
      }
    }
  }
}
