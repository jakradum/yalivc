export default {
  name: 'investorRelations',
  title: 'Investor Relations',
  type: 'document',
  fields: [
    {
      name: 'documents',
      title: 'Documents',
      type: 'array',
      description: 'PDFs displayed on the Investor Relations page',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Document Title',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'file',
              title: 'PDF File',
              type: 'file',
              options: { accept: '.pdf' },
              validation: Rule => Rule.required(),
            },
          ],
          preview: {
            select: { title: 'title' },
            prepare({ title }) {
              return { title: title || 'Untitled document' };
            },
          },
        },
      ],
    },
  ],
  preview: {
    prepare() {
      return { title: 'Investor Relations' };
    },
  },
}
