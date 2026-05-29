export default {
  name: 'deckAsset',
  title: 'Deck Assets',
  type: 'document',

  groups: [
    { name: 'info', title: 'Info', default: true },
    { name: 'asset', title: 'Asset' },
  ],

  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Company name, LP name, or asset label',
      validation: (Rule) => Rule.required(),
      group: 'info',
    },
    {
      name: 'deck',
      title: 'Deck',
      type: 'string',
      options: {
        list: [
          { title: 'Fund II Deck', value: 'fund-2-deck' },
          { title: 'Fund I Deck', value: 'fund-1-deck' },
        ],
        layout: 'radio',
      },
      initialValue: 'fund-2-deck',
      validation: (Rule) => Rule.required(),
      group: 'info',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Company Logo', value: 'company-logo' },
          { title: 'LP Logo', value: 'lp-logo' },
          { title: 'Team Photo', value: 'team-photo' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      initialValue: 'company-logo',
      validation: (Rule) => Rule.required(),
      group: 'info',
    },
    {
      name: 'logo',
      title: 'Logo / Image',
      type: 'image',
      options: { hotspot: true },
      group: 'asset',
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 2,
      description: 'Optional context — e.g. which slide this appears on',
      group: 'info',
    },
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'logo',
    },
    prepare({ title, subtitle, media }) {
      const labels = {
        'company-logo': 'Company Logo',
        'lp-logo': 'LP Logo',
        'team-photo': 'Team Photo',
        'other': 'Other',
      };
      return {
        title,
        subtitle: labels[subtitle] || subtitle,
        media,
      };
    },
  },

  orderings: [
    {
      title: 'Title A–Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [{ field: 'category', direction: 'asc' }],
    },
  ],
}
