const news = {
  name: 'news',
  title: 'News Articles',
  type: 'document',
  fields: [
    {
      name: 'url',
      title: 'Article URL',
      type: 'url',
      validation: Rule => Rule.required().uri({
        scheme: ['http', 'https']
      })
    },
    {
      name: 'date',
      title: 'Publication Date',
      type: 'date',
      validation: Rule => Rule.required()
    },
    {
      name: 'publication',
      title: 'Publication',
      type: 'string',
      // REMOVED: to: [{type: 'publication'}] - can't use with type: 'string'
      validation: Rule => Rule.required()
    },
    {
      name: 'headlineEdited',
      title: 'Headline',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'isVideo',
      title: 'Is Video?',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'featured',
      title: 'Featured on Homepage?',
      type: 'boolean',
      initialValue: false
    }
  ],
  preview: {
    select: {
      title: 'headlineEdited',
      publication: 'publication',
      date: 'date'
    },
    prepare({title, publication, date}) {
      return {
        title,
        subtitle: `${publication} - ${new Date(date).toLocaleDateString()}`
      }
    }
  },
  orderings: [
    {
      title: 'Date, Newest',
      name: 'dateDesc',
      by: [{field: 'date', direction: 'desc'}]
    }
  ]
}

export default news