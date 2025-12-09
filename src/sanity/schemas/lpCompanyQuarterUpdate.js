export default {
  name: 'lpCompanyQuarterUpdate',
  title: 'LP Company Quarter Update',
  type: 'document',

  groups: [
    { name: 'identity', title: 'Quarter Identity' },
    { name: 'valuation', title: 'Valuation' },
    { name: 'updates', title: 'Updates' },
    { name: 'financials', title: 'Financials' },
    { name: 'metrics', title: 'Metrics' },
  ],

  fields: [
    // IDENTIFIERS
    {
      name: 'investment',
      title: 'Investment',
      type: 'reference',
      to: [{ type: 'lpInvestment' }],
      validation: Rule => Rule.required(),
      group: 'identity'
    },
    {
      name: 'quarter',
      title: 'Quarter',
      type: 'string',
      options: {
        list: ['Q1', 'Q2', 'Q3', 'Q4']
      },
      validation: Rule => Rule.required(),
      group: 'identity'
    },
    {
      name: 'fiscalYear',
      title: 'Fiscal Year',
      type: 'string',
      description: 'e.g., "FY26"',
      validation: Rule => Rule.required(),
      group: 'identity'
    },

    // VALUATION SNAPSHOT
    {
      name: 'currentFMV',
      title: 'Fair Market Value (₹ Crores)',
      type: 'number',
      description: 'FMV as of quarter end',
      group: 'valuation'
    },
    {
      name: 'currentOwnershipPercent',
      title: 'Current Ownership (%)',
      type: 'number',
      description: 'May change due to dilution',
      group: 'valuation'
    },
    {
      name: 'amountReturned',
      title: 'Amount Returned (₹ Crores)',
      type: 'number',
      initialValue: 0,
      group: 'valuation'
    },
    {
      name: 'multipleOfInvestment',
      title: 'Multiple of Investment (MOIC)',
      type: 'number',
      group: 'valuation'
    },

    // QUARTERLY UPDATES (Bullet points)
    {
      name: 'updates',
      title: 'Quarter Updates',
      type: 'array',
      of: [{ type: 'text' }],
      description: 'Key updates/achievements this quarter (one per item)',
      group: 'updates'
    },

    // FINANCIALS (if revenue positive)
    {
      name: 'revenueINR',
      title: 'Revenue (₹ Crores)',
      type: 'number',
      group: 'financials'
    },
    {
      name: 'patINR',
      title: 'Profit After Tax (₹ Crores)',
      type: 'number',
      description: 'Use negative for losses',
      group: 'financials'
    },

    // TEAM/OPERATIONAL METRICS (optional)
    {
      name: 'teamSize',
      title: 'Team Size',
      type: 'number',
      group: 'metrics'
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
      description: 'Custom metrics like "Order Book", "Customer Pipeline", etc.',
      group: 'metrics'
    }
  ],

  preview: {
    select: {
      company: 'investment.company.name',
      quarter: 'quarter',
      year: 'fiscalYear',
      fmv: 'currentFMV'
    },
    prepare({ company, quarter, year, fmv }) {
      return {
        title: company || 'Unknown Company',
        subtitle: `${quarter} ${year}${fmv ? ` • FMV: ₹${fmv} Cr` : ''}`
      }
    }
  },

  orderings: [
    {
      title: 'By Quarter (Newest)',
      name: 'quarterDesc',
      by: [
        { field: 'fiscalYear', direction: 'desc' },
        { field: 'quarter', direction: 'desc' }
      ]
    },
    {
      title: 'By Company',
      name: 'byCompany',
      by: [
        { field: 'investment.company.name', direction: 'asc' },
        { field: 'fiscalYear', direction: 'desc' },
        { field: 'quarter', direction: 'desc' }
      ]
    }
  ]
}
