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
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'highlights',
      title: 'Key Highlights',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Key bullet points for this report'
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