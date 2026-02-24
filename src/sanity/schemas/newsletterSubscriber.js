const newsletterSubscriber = {
  name: 'newsletterSubscriber',
  title: 'Newsletter Subscribers',
  type: 'document',
  fields: [
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: 'subscribedAt',
      title: 'Subscribed At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Where the subscriber signed up from',
      options: {
        list: [
          { title: 'Homepage Footer', value: 'homepage-footer' },
          { title: 'Import', value: 'import' },
        ],
      },
      initialValue: 'homepage-footer',
    },
  ],
  preview: {
    select: {
      email: 'email',
      subscribedAt: 'subscribedAt',
      source: 'source',
    },
    prepare({ email, subscribedAt, source }) {
      const date = subscribedAt ? new Date(subscribedAt).toLocaleDateString('en-IN') : '';
      return {
        title: email,
        subtitle: `${date}${source ? ` · ${source}` : ''}`,
      };
    },
  },
  orderings: [
    {
      title: 'Most Recent',
      name: 'subscribedAtDesc',
      by: [{ field: 'subscribedAt', direction: 'desc' }],
    },
  ],
};

export default newsletterSubscriber;
