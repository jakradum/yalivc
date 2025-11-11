export default {
  name: 'quarterlyReport',
  title: 'Quarterly Reports',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Report Title',
      type: 'string',
      placeholder: 'e.g., Q1 2025 Report',
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
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: Rule => Rule.required().min(2020).max(2100)
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
      name: 'publishStatus',
      title: 'Publish Status',
      type: 'string',
      options: {
        list: [
          {title: 'Hidden', value: 'hidden'},
          {title: 'Published', value: 'published'}
        ]
      },
      initialValue: 'hidden',
      validation: Rule => Rule.required()
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date'
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first'
    }
  ],
  preview: {
    select: {
      title: 'title',
      status: 'publishStatus',
      year: 'year',
      quarter: 'quarter'
    },
    prepare({title, status, year, quarter}) {
      return {
        title,
        subtitle: `${quarter} ${year} - ${status}`
      }
    }
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'yearDesc',
      by: [
        {field: 'year', direction: 'desc'},
        {field: 'quarter', direction: 'desc'}
      ]
    }
  ]
}