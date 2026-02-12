import {portableTextConfig} from './portableTextConfig';

const teamMember = {
  name: 'teamMember',
  title: 'Team Members',
  type: 'document',
  description: 'Team members including core team',
  fields: [
    {
      name: 'profileType',
      title: 'Profile Type',
      type: 'string',
      options: {
        list: [
          { title: 'Individual', value: 'individual' },
          { title: 'Group', value: 'group' },
        ],
        layout: 'radio'
      },
      initialValue: 'individual',
      description: 'Individual = person with full bio. Group = team/department (e.g., "Yali Investments Team")'
    },
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
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier (e.g., pranav-karnad)',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'role',
      title: 'Role/Title',
      type: 'string',
      validation: Rule => Rule.required(),
      readOnly: ({document}) => document?.isCore === true
    },
    {
      name: 'department',
      title: 'Department',
      type: 'string',
      description: 'Used for ordering: Investment team shows before Operations',
      options: {
        list: [
          { title: 'Investment', value: 'investment' },
          { title: 'Operations', value: 'operations' },
        ],
      },
      initialValue: 'investment',
      validation: Rule => Rule.custom((value, context) => {
        if (context.document?.profileType === 'group') return true;
        return value ? true : 'Department is required for individuals';
      }),
      hidden: ({document}) => document?.profileType === 'group'
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
      validation: Rule => Rule.custom((value, context) => {
        if (context.document?.profileType === 'group') return true;
        return value ? true : 'Biography is required for individuals';
      }),
      readOnly: ({document}) => document?.isCore === true,
      hidden: ({document}) => document?.profileType === 'group'
    },
    {
      name: 'groupDescription',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Optional longer description for this group/team',
      hidden: ({document}) => document?.profileType !== 'group'
    },
    {
      name: 'showOnHomepage',
      title: 'Show on Homepage',
      type: 'boolean',
       validation: Rule => Rule.required(),
      description: 'Display this team member on the homepage',
      initialValue: false
    },
    {
      name: 'personalPhilosophy',
      title: 'Personal Philosophy',
      description: 'Long-form personal philosophy written by the team member',
      ...portableTextConfig,
      hidden: ({document}) => document?.profileType === 'group'
    },
    {
      name: 'pullQuote',
      title: 'Pull Quote',
      type: 'text',
      rows: 3,
      description: 'A memorable quote about or from this person (displayed on profile page)',
      hidden: ({document}) => document?.profileType === 'group'
    },
    {
      name: 'pullQuoteAttribution',
      title: 'Pull Quote Attribution',
      type: 'string',
      description: 'Who said or wrote this quote (e.g., "John Doe, Founder of XYZ")',
      hidden: ({document}) => document?.profileType === 'group'
    },
    {
      name: 'outsideWork',
      title: 'Who am I outside of work?',
      type: 'array',
      description: 'Add bullet points - click "+ Add item" for each point',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      },
      hidden: ({document}) => document?.profileType === 'group'
    },
    {
      name: 'recommendation',
      title: 'Recommendation',
      type: 'object',
      description: 'A LinkedIn-style recommendation from a friend or colleague',
      fields: [
        {
          name: 'text',
          title: 'Recommendation Text',
          type: 'text',
          rows: 4,
          description: 'The recommendation message'
        },
        {
          name: 'authorName',
          title: 'Author Name',
          type: 'string',
          description: 'Name of the person giving the recommendation'
        },
        {
          name: 'authorTitle',
          title: 'Author Title/Relationship',
          type: 'string',
          description: 'e.g., "Co-founder at XYZ" or "College friend" or "Former colleague"'
        }
      ],
      hidden: ({document}) => document?.profileType === 'group'
    },
    {
      name: 'articles',
      title: 'Articles Authored',
      type: 'array',
      description: 'Articles or posts written by this team member',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Article Title',
              type: 'string',
              validation: Rule => Rule.required()
            },
            {
              name: 'url',
              title: 'Article URL',
              type: 'url',
              validation: Rule => Rule.required()
            },
            {
              name: 'publication',
              title: 'Publication/Platform',
              type: 'string',
              description: 'e.g., "Medium", "LinkedIn", "Forbes"'
            },
            {
              name: 'date',
              title: 'Publication Date',
              type: 'date'
            }
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'publication'
            }
          }
        }
      ],
      hidden: ({document}) => document?.profileType === 'group'
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
      validation: Rule => Rule.custom((value, context) => {
        if (context.document?.profileType === 'group') return true;
        if (!value) return 'LinkedIn URL is required for individuals';
        try {
          new URL(value);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }),
      readOnly: ({document}) => document?.isCore === true,
      hidden: ({document}) => document?.profileType === 'group'
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
      type: 'boolean',
      description: 'Toggle ON for Active, OFF for Alumni',
      initialValue: true,
      validation: Rule => Rule.required(),
      readOnly: ({document}) => document?.isCore === true
    },
    {
      name: 'enableTeamPage',
      title: 'Enable Team Member Page',
      type: 'boolean',
      description: 'Enable to make this team member\'s detail page accessible from the website',
      initialValue: false
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'photo',
      isCore: 'isCore',
      profileType: 'profileType'
    },
    prepare({title, subtitle, media, isCore, profileType}) {
      const prefix = profileType === 'group' ? '👥 ' : (isCore ? '⭐ ' : '');
      return {
        title: `${prefix}${title}`,
        subtitle,
        media
      }
    }
  }
}

export default teamMember
