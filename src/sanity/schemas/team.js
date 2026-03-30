export default {
  name: 'teamMember',
  title: 'Team Members',
  type: 'document',
  description: 'Non-core team members (core 5 are hardcoded)',
  groups: [
    { name: 'main', title: 'Main', default: true },
    { name: 'dataRoom', title: 'Data Room' },
  ],
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      group: 'main',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'role',
      title: 'Role/Title',
      type: 'string',
      group: 'main',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'bio',
      title: 'Biography',
      type: 'text',
      group: 'main',
      rows: 4,
    },
    {
      name: 'oneLiner',
      title: 'One-Liner',
      type: 'string',
      group: 'main',
      description: 'Brief description (max 100 characters)',
      validation: (Rule) => Rule.required().max(100),
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      group: 'main',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'linkedIn',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'main',
      validation: (Rule) =>
        Rule.required().uri({ scheme: ['https'] }),
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      group: 'main',
      description: 'Lower numbers appear first',
    },
    // ── DATA ROOM TAB ──
    {
      name: 'dataRoomBio',
      title: 'Data Room Bio',
      type: 'array',
      group: 'dataRoom',
      of: [{ type: 'block' }],
      description: 'If left empty, the main site bio will be used as fallback in the data room.',
    },
    {
      name: 'previousEmployers',
      title: 'Work History (Logos)',
      type: 'array',
      group: 'dataRoom',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'companyName',
              title: 'Company Name',
              type: 'string',
              description: 'Used as alt text and text fallback if no logo is uploaded.',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'logo',
              title: 'Logo',
              type: 'image',
              description: 'Optional. If provided, logo is shown; otherwise company name is shown as text.',
              options: { hotspot: false },
            },
            {
              name: 'companyUrl',
              title: 'Company URL',
              type: 'url',
              description: 'Optional link for the company.',
            },
            {
              name: 'order',
              title: 'Order',
              type: 'number',
              description: 'Lower numbers appear first.',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: 'companyName' },
            prepare({ title }) {
              return { title: title || 'Unnamed employer' };
            },
          },
        },
      ],
      options: { sortable: true },
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
