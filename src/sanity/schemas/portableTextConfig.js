export const portableTextConfig = {
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
          {title: 'Emphasis', value: 'em'},
          {title: 'Code', value: 'code'}
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
                type: 'url',
                validation: Rule => Rule.uri({
                  scheme: ['http', 'https', 'mailto', 'tel']
                })
              },
              {
                title: 'Open in new tab',
                name: 'blank',
                type: 'boolean',
                initialValue: true
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
          title: 'Alt text',
          description: 'Important for SEO and accessibility'
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption'
        }
      ]
    },
    // Pull Quote - Short, impactful quote
    {
      name: 'pullQuote',
      type: 'object',
      title: 'Pull Quote',
      description: 'Short, attention-grabbing quote (< 50 words)',
      fields: [
        {
          name: 'text',
          type: 'text',
          title: 'Quote Text',
          validation: Rule => Rule.required()
        },
        {
          name: 'attribution',
          type: 'string',
          title: 'Attribution',
          description: 'Optional: Person or source (e.g., "John Doe, CEO")'
        }
      ],
      preview: {
        select: {
          text: 'text',
          attribution: 'attribution'
        },
        prepare({text, attribution}) {
          return {
            title: '💬 Pull Quote',
            subtitle: text.slice(0, 60) + (text.length > 60 ? '...' : '')
          }
        }
      }
    },
    // Block Quote - Longer quote
    {
      name: 'blockQuote',
      type: 'object',
      title: 'Block Quote',
      description: 'Longer quote or excerpt (50+ words)',
      fields: [
        {
          name: 'text',
          type: 'text',
          title: 'Quote Text',
          rows: 5,
          validation: Rule => Rule.required()
        },
        {
          name: 'attribution',
          type: 'string',
          title: 'Attribution',
          description: 'Optional: Person or source'
        },
        {
          name: 'cite',
          type: 'url',
          title: 'Source URL',
          description: 'Optional: Link to original source'
        }
      ],
      preview: {
        select: {
          text: 'text',
          attribution: 'attribution'
        },
        prepare({text, attribution}) {
          return {
            title: '📝 Block Quote',
            subtitle: text.slice(0, 60) + (text.length > 60 ? '...' : '')
          }
        }
      }
    }
  ]
};
