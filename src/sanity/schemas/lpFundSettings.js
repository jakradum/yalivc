export default {
  name: 'lpFundSettings',
  title: 'LP Fund Settings',
  type: 'document',

  groups: [
    { name: 'identity', title: 'Fund Identity' },
    { name: 'dates', title: 'Key Dates' },
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

    // FUND SIZE
    {
      name: 'targetFundSizeINR',
      title: 'Target Fund Size (₹ Crores)',
      type: 'number',
      group: 'identity'
    },
    {
      name: 'targetFundSizeUSD',
      title: 'Target Fund Size ($ Million)',
      type: 'number',
      group: 'identity'
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
      type: 'string',
      description: 'e.g., "investor.relations@yali.vc"',
      group: 'contacts'
    },
    {
      name: 'additionalContacts',
      title: 'Additional Contact Emails',
      type: 'array',
      of: [{ type: 'string' }],
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
        title: title || 'Fund Settings',
        subtitle: 'Singleton'
      }
    }
  }
}
