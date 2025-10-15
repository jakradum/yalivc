export default {
  name: 'teamMember',
  title: 'Team Members',
  type: 'document',
  description: 'Non-core team members (core 5 are hardcoded)',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'role',
      title: 'Role/Title',
      type: 'string',
      options: {
        list: [
          { title: 'Investments', value: 'Investments' },
          { title: 'Platform & Ops', value: 'Platform & Ops' },
          { title: 'Advisor', value: 'Advisor' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'bio',
      title: 'Biography',
      type: 'text',
      rows: 4,
    },
    {
      name: 'oneLiner',
      title: 'One-Liner',
      type: 'string',
      description: 'Brief description (max 100 characters)',
      validation: (Rule) => Rule.required().max(100),
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'linkedIn',
      title: 'LinkedIn URL',
      type: 'url',
      validation: (Rule) =>
        Rule.required().uri({
          scheme: ['https'],
        }),
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
      title: 'name',
      subtitle: 'role',
      media: 'photo',
    },
  },
};
