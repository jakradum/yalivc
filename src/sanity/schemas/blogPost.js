export default {
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
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
      name: 'blurb',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      validation: Rule => Rule.max(200)
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'}
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'}
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'URL',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url'
                  }
                ]
              }
            ]
          }
        },
        {
          type: 'image',
          options: {hotspot: true}
        }
      ]
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'teamMember'}]
    },
    {
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true
      }
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date',
      validation: Rule => Rule.required()
    },
    {
      name: 'readTime',
      title: 'Read Time (minutes)',
      type: 'number',
      description: 'Auto-calculated from word count'
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'}
        ]
      },
      initialValue: 'draft',
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'featuredImage'
    },
    prepare({title, author, media}) {
      return {
        title,
        subtitle: author ? `by ${author}` : 'No author',
        media
      }
    }
  },
  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedDesc',
      by: [{field: 'publishedAt', direction: 'desc'}]
    }
  ]
}