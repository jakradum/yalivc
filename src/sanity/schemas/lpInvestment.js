export default {
  name: 'lpInvestment',
  title: 'LP Investment',
  type: 'document',

  groups: [
    { name: 'company', title: 'Company' },
    { name: 'terms', title: 'Investment Terms' },
    { name: 'economics', title: 'Round Economics' },
    { name: 'coinvestors', title: 'Co-Investors' },
    { name: 'quarterly', title: 'Quarterly Performance' },
    { name: 'status', title: 'Status' },
  ],

  fields: [
    // LINK TO MASTER COMPANY
    {
      name: 'company',
      title: 'Portfolio Company',
      type: 'reference',
      to: [{ type: 'company' }],
      validation: Rule => Rule.required(),
      description: 'Select from existing companies in Sanity',
      group: 'company'
    },

    // COMPANY DESCRIPTION (for report - may differ from website)
    {
      name: 'reportDescription',
      title: 'Company Description (for LP Report)',
      type: 'text',
      description: 'About the company text specifically for LP reports. If blank, uses company detail.',
      group: 'company'
    },

    // INVESTMENT DETAILS (Static after entry)
    {
      name: 'investmentDate',
      title: 'Date of First Investment',
      type: 'date',
      validation: Rule => Rule.required(),
      group: 'terms'
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
          { title: 'Growth', value: 'growth' }
        ]
      },
      group: 'terms'
    },

    // ROUND ECONOMICS
    {
      name: 'preMoneyValuation',
      title: 'Pre-Money Valuation (₹ Crores)',
      type: 'number',
      group: 'economics'
    },
    {
      name: 'totalRoundSize',
      title: 'Total Round Size (₹ Crores)',
      type: 'number',
      group: 'economics'
    },
    {
      name: 'postMoneyValuation',
      title: 'Post-Money Valuation (₹ Crores)',
      type: 'number',
      group: 'economics'
    },

    // YALI'S POSITION
    {
      name: 'yaliInvestmentAmount',
      title: "Yali's Investment Amount (₹ Crores)",
      type: 'number',
      validation: Rule => Rule.required(),
      group: 'economics'
    },
    {
      name: 'yaliOwnershipPercent',
      title: "Yali's Ownership (%)",
      type: 'number',
      description: 'Fully diluted ownership percentage at time of investment',
      group: 'economics'
    },

    // CO-INVESTORS
    {
      name: 'coInvestors',
      title: 'Key Co-Investors',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List co-investor names',
      group: 'coinvestors'
    },

    // QUARTERLY PERFORMANCE DATA
    {
      name: 'quarterlyUpdates',
      title: 'Quarterly Performance Updates',
      type: 'array',
      of: [{
        type: 'object',
        name: 'quarterUpdate',
        title: 'Quarter Update',
        fields: [
          {
            name: 'quarter',
            title: 'Quarter',
            type: 'string',
            options: {
              list: ['Q1', 'Q2', 'Q3', 'Q4']
            },
            validation: Rule => Rule.required()
          },
          {
            name: 'fiscalYear',
            title: 'Fiscal Year',
            type: 'string',
            description: 'e.g., "FY26" or "2025-26"',
            validation: Rule => Rule.required()
          },
          {
            name: 'currentFMV',
            title: 'Fair Market Value (₹ Crores)',
            type: 'number',
            description: 'FMV as of quarter end'
          },
          {
            name: 'currentOwnershipPercent',
            title: 'Current Ownership (%)',
            type: 'number',
            description: 'May change due to dilution'
          },
          {
            name: 'amountReturned',
            title: 'Amount Returned (₹ Crores)',
            type: 'number',
            initialValue: 0
          },
          {
            name: 'multipleOfInvestment',
            title: 'Multiple of Investment (MOIC)',
            type: 'number'
          },
          {
            name: 'revenueINR',
            title: 'Revenue (₹ Crores)',
            type: 'number',
            description: 'Quarterly revenue'
          },
          {
            name: 'patINR',
            title: 'Profit After Tax (₹ Crores)',
            type: 'number',
            description: 'Use negative for losses'
          },
          {
            name: 'teamSize',
            title: 'Team Size',
            type: 'number'
          },
          {
            name: 'keyMetrics',
            title: 'Key Metrics',
            type: 'array',
            of: [{
              type: 'object',
              fields: [
                { name: 'label', type: 'string', title: 'Metric Name' },
                { name: 'value', type: 'string', title: 'Value' }
              ],
              preview: {
                select: {
                  title: 'label',
                  subtitle: 'value'
                }
              }
            }],
            description: 'Custom metrics like "Order Book", "Customer Pipeline", etc.'
          },
          {
            name: 'updates',
            title: 'Quarter Updates',
            type: 'array',
            of: [{ type: 'text' }],
            description: 'Key updates/achievements this quarter (one per item)'
          }
        ],
        preview: {
          select: {
            quarter: 'quarter',
            year: 'fiscalYear',
            fmv: 'currentFMV',
            revenue: 'revenueINR'
          },
          prepare({ quarter, year, fmv, revenue }) {
            const metrics = [];
            if (fmv) metrics.push(`FMV: ₹${fmv} Cr`);
            if (revenue) metrics.push(`Rev: ₹${revenue} Cr`);
            return {
              title: `${quarter} ${year}`,
              subtitle: metrics.join(' • ') || 'No financial data'
            }
          }
        }
      }],
      description: 'Add quarterly performance data for each quarter since investment',
      group: 'quarterly'
    },

    // STATUS
    {
      name: 'status',
      title: 'Investment Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Exited', value: 'exited' },
          { title: 'Written Off', value: 'written-off' }
        ]
      },
      initialValue: 'active',
      group: 'status'
    },
    {
      name: 'isRevenuePositive',
      title: 'Is Revenue Positive?',
      type: 'boolean',
      initialValue: false,
      group: 'status'
    },
    {
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which company appears in reports (lower = first)',
      group: 'status'
    }
  ],

  preview: {
    select: {
      title: 'company.name',
      subtitle: 'fundingRound',
      media: 'company.logo',
      status: 'status'
    },
    prepare({ title, subtitle, media, status }) {
      const statusIcon = status === 'active' ? '✓' : status === 'exited' ? '→' : '✗';
      return {
        title: title || 'Unknown Company',
        subtitle: `${statusIcon} ${subtitle || 'Unknown Round'}`,
        media
      }
    }
  },

  orderings: [
    {
      title: 'By Investment Date',
      name: 'investmentDateAsc',
      by: [{ field: 'investmentDate', direction: 'asc' }]
    },
    {
      title: 'By Display Order',
      name: 'displayOrderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }]
    }
  ]
}
