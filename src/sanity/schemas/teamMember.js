const teamMember = {
  name: 'teamMember',
  title: 'Team Members',
  type: 'document',
  description: 'Team members including core team',
  fields: [
    {
      name: 'isCore',
      title: 'Core Team Member',
      type: 'boolean',
      description: 'Core team members are read-only',
      initialValue: false,
      hidden: true
    },
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required(),
      readOnly: ({document}) => document?.isCore === true
    },
    {
      name: 'role',
      title: 'Role/Title',
      type: 'string',
      validation: Rule => Rule.required(),
      readOnly: ({document}) => document?.isCore === true
    },
    {
      name: 'oneLiner',
      title: 'One-Liner',
      type: 'string',
      description: 'Brief description (max 100 characters)',
      validation: Rule => Rule.required().max(100),
      readOnly: ({document}) => document?.isCore === true
    },
    {
      name: 'bio',
      title: 'Biography',
      type: 'text',
      rows: 4,
      readOnly: ({document}) => document?.isCore === true
    },
    {
      name: 'personalPhilosophy',
      title: 'Personal Philosophy',
      type: 'array',
      description: 'Long-form personal philosophy written by the team member',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H3', value: 'h3'}
          ],
          lists: [],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'}
            ]
          }
        }
      ]
    },
    {
      name: 'outsideWork',
      title: 'Who am I outside of work?',
      type: 'array',
      description: 'Add bullet points - click "+ Add item" for each point',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required(),
      readOnly: ({document}) => document?.isCore === true
    },
    {
      name: 'linkedIn',
      title: 'LinkedIn URL',
      type: 'url',
      validation: Rule => Rule.uri({
        scheme: ['http', 'https']
      }).required(),
      readOnly: ({document}) => document?.isCore === true
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      readOnly: ({document}) => document?.isCore === true
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
      validation: Rule => Rule.required(),
      readOnly: ({document}) => document?.isCore === true
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'photo',
      isCore: 'isCore'
    },
    prepare({title, subtitle, media, isCore}) {
      return {
        title: isCore ? `⭐ ${title}` : title,
        subtitle,
        media
      }
    }
  }
}

export default teamMember