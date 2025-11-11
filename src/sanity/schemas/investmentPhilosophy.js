export default {
  name: 'investmentPhilosophy',
  title: 'Investment Philosophy',
  type: 'document',
  // Singleton - only one document allowed
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'philosophyText',
      title: 'Investment Philosophy',
      type: 'array',
      description: 'YALI\'s investment approach and thesis',
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
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt text'
            }
          ]
        }
      ],
      validation: Rule => Rule.required()
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
      description: 'Auto-updated when changes are published',
      readOnly: true
    }
  ],
  preview: {
    prepare() {
      return {
        title: 'Investment Philosophy',
        subtitle: 'Singleton document'
      }
    }
  }
}
