const faq = {
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'type',
      title: 'FAQ Type',
      type: 'string',
      options: {
        list: [
          { title: 'Contact Page - Pitch FAQs', value: 'pitch' },
          { title: 'About Page - Company FAQs', value: 'company' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    },
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'type',
    },
  },
};

export default faq;
