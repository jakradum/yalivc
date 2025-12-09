export default {
  name: 'quarterlyReport',
  title: 'Quarterly Reports',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Report Title',
      type: 'string',
      placeholder: 'e.g., Q2 FY26',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'quarter',
      title: 'Quarter',
      type: 'string',
      options: {
        list: [
          {title: 'Q1', value: 'Q1'},
          {title: 'Q2', value: 'Q2'},
          {title: 'Q3', value: 'Q3'},
          {title: 'Q4', value: 'Q4'}
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'fiscalYear',
      title: 'Fiscal Year',
      type: 'string',
      placeholder: 'e.g., FY26',
      validation: Rule => Rule.required()
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'Brief description for the listing page'
    },
    {
      name: 'pdfFile',
      title: 'PDF File',
      type: 'file',
      options: {
        accept: 'application/pdf'
      }
    },
    {
      name: 'highlights',
      title: 'Key Highlights',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Key bullet points for this report'
    },

    // Cover Note Section
    {
      name: 'coverNote',
      title: 'Cover Note',
      type: 'object',
      fields: [
        {
          name: 'greeting',
          title: 'Greeting',
          type: 'string',
          initialValue: 'Dear Partners,'
        },
        {
          name: 'paragraphs',
          title: 'Content Paragraphs',
          type: 'array',
          of: [{type: 'text'}]
        },
        {
          name: 'signatoryName',
          title: 'Signatory Name',
          type: 'string',
          initialValue: 'Raghunandan G'
        },
        {
          name: 'signatoryTitle',
          title: 'Signatory Title',
          type: 'string',
          initialValue: 'Managing Partner'
        }
      ]
    },

    // Fund Summary Section
    {
      name: 'fundSummary',
      title: 'Fund Summary',
      type: 'object',
      fields: [
        {
          name: 'targetCorpus',
          title: 'Target Corpus',
          type: 'string',
          placeholder: '₹300 Cr'
        },
        {
          name: 'capitalRaised',
          title: 'Capital Raised',
          type: 'string',
          placeholder: '₹225 Cr'
        },
        {
          name: 'capitalDeployed',
          title: 'Capital Deployed',
          type: 'string',
          placeholder: '₹85 Cr'
        },
        {
          name: 'navPerUnit',
          title: 'NAV per Unit',
          type: 'string',
          placeholder: '₹1.12'
        },
        {
          name: 'irr',
          title: 'Gross IRR',
          type: 'string',
          placeholder: '18.5%'
        },
        {
          name: 'moic',
          title: 'MOIC',
          type: 'string',
          placeholder: '1.15x'
        }
      ]
    },

    // Portfolio Company Data (LP-specific)
    {
      name: 'portfolioData',
      title: 'Portfolio Company Data',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'company',
            title: 'Company',
            type: 'reference',
            to: [{type: 'company'}],
            validation: Rule => Rule.required()
          },
          {
            name: 'dateOfFirstInvestment',
            title: 'Date of First Investment',
            type: 'date'
          },
          {
            name: 'fundingRound',
            title: 'Funding Round',
            type: 'string',
            options: {
              list: ['Pre-Seed', 'Seed', 'Pre-Series A', 'Series A', 'Series B', 'Series C+']
            }
          },
          {
            name: 'totalAmountInvested',
            title: 'Total Amount Invested (Cr)',
            type: 'number'
          },
          {
            name: 'ownershipFullyDiluted',
            title: 'Ownership Fully Diluted (%)',
            type: 'number'
          },
          {
            name: 'fmv',
            title: 'FMV (Cr)',
            type: 'number'
          },
          {
            name: 'amountReturnedToInvestors',
            title: 'Amount Returned to Investors',
            type: 'string',
            description: 'Enter "-" if none'
          },
          {
            name: 'multipleOfInvestment',
            title: 'Multiple of Investment',
            type: 'number'
          },
          {
            name: 'keyCoInvestors',
            title: 'Key Co-investors',
            type: 'array',
            of: [{type: 'string'}]
          }
        ],
        preview: {
          select: {
            title: 'company.name',
            subtitle: 'fundingRound'
          }
        }
      }]
    },

    // Media Coverage
    {
      name: 'mediaCoverage',
      title: 'Media Coverage',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'date',
            title: 'Date',
            type: 'date'
          },
          {
            name: 'title',
            title: 'Headline',
            type: 'string'
          },
          {
            name: 'url',
            title: 'URL',
            type: 'url'
          }
        ]
      }]
    },

    // Contact Info
    {
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      fields: [
        {
          name: 'newsroomUrl',
          title: 'Newsroom URL',
          type: 'url',
          initialValue: 'https://yali.vc/newsroom'
        },
        {
          name: 'irEmail',
          title: 'Investor Relations Email',
          type: 'string',
          initialValue: 'investor.relations@yali.vc'
        }
      ]
    },

    {
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      description: 'Control visibility to LPs',
      initialValue: false
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first (optional, defaults to date sorting)'
    }
  ],
  preview: {
    select: {
      title: 'title',
      quarter: 'quarter',
      fiscalYear: 'fiscalYear',
      isPublished: 'isPublished'
    },
    prepare({title, quarter, fiscalYear, isPublished}) {
      const status = isPublished ? '✓ Published' : '○ Draft';
      return {
        title: title || `${quarter} ${fiscalYear}`,
        subtitle: `${quarter} ${fiscalYear} - ${status}`
      }
    }
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'newestFirst',
      by: [
        {field: 'publishedAt', direction: 'desc'}
      ]
    },
    {
      title: 'Custom Order',
      name: 'customOrder',
      by: [
        {field: 'order', direction: 'asc'},
        {field: 'publishedAt', direction: 'desc'}
      ]
    }
  ]
}
