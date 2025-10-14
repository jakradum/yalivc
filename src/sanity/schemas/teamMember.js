const teamMember = {
  name: 'teamMember',
  title: 'Team Members',
  type: 'document',
  description: 'Non-core team members (core 5 are hardcoded)',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'role',
      title: 'Role/Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'oneLiner',
      title: 'One-Liner',
      type: 'string',
      description: 'Brief description (max 100 characters)',
      validation: Rule => Rule.required().max(100)
    },
    {
      name: 'bio',
      title: 'Biography',
      type: 'text',
      rows: 4
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'linkedIn',
      title: 'LinkedIn URL',
      type: 'url',
      validation: Rule => Rule.uri({
        scheme: ['http', 'https']
      }).required()
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first'
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Alumni', value: 'alumni'}
        ]
      },
      initialValue: 'active',
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'photo'
    }
  }
}

export default teamMember
