export default {
  name: 'lpFundSettings',
  title: 'LP Fund Settings',
  type: 'document',

  groups: [
    { name: 'identity', title: 'Fund Identity' },
    { name: 'fundSize', title: 'Fund Size & Capital' },
    { name: 'dates', title: 'Key Dates' },
    { name: 'strategy', title: 'Strategy' },
    { name: 'contacts', title: 'Contacts' },
    { name: 'branding', title: 'Branding' },
    { name: 'performance', title: 'Current Performance' },
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
    {
      name: 'amountDrawnDown',
      title: 'Amount Drawn Down as per Bank',
      type: 'number',
      group: 'performance',
      description: 'Total capital drawn from LPs'
    },
    {
      name: 'totalInvested',
      title: 'Total Invested in Portfolio',
      type: 'number',
      group: 'performance',
      description: 'Capital actually deployed into companies'
    },
    {
      name: 'fairMarketValue',
      title: 'Fair Market Value (FMV)',
      type: 'number',
      group: 'performance',
      description: 'FMV including realised value'
    },
    {
      name: 'portfolioCompanies',
      title: 'Number of Portfolio Companies',
      type: 'number',
      group: 'performance'
    },
    {
      name: 'amountReturned',
      title: 'Amount Returned',
      type: 'number',
      group: 'performance',
      description: 'Including passive income returned'
    },
    {
      name: 'moic',
      title: 'MOIC',
      type: 'string', // String allows "0.00x" formatting, or use number
      group: 'performance'
    },
    {
      name: 'tvpi',
      title: 'TVPI',
      type: 'string',
      group: 'performance'
    },
    {
      name: 'dpi',
      title: 'DPI',
      type: 'string',
      group: 'performance'
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
