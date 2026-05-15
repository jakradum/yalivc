const news = {
  name: 'news',
  title: 'News Articles',
  type: 'document',
  fields: [
    {
      name: 'url',
      title: 'Article URL',
      type: 'string',
      validation: Rule => Rule.required().custom(val => {
        if (!val) return true;
        const url = /^https?:\/\//i.test(val) ? val : `https://${val}`;
        try { new URL(url); return true; } catch { return 'Please enter a valid URL'; }
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
      type: 'reference',
      to: [{type: 'publication'}],
      description: 'Optional for video links (YouTube, etc.)'
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
      name: 'videoSource',
      title: 'Video Source',
      type: 'string',
      hidden: ({ document }) => !document?.isVideo,
      options: {
        list: [
          { title: 'YouTube', value: 'youtube' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      initialValue: 'youtube',
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
      publication: 'publication.name',
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