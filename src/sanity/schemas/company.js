export default {
  name: 'company',
  title: 'Company',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Company Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'oneLiner',
      title: 'One-liner',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'detail',
      title: 'Detailed Description',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'link',
      title: 'Website URL',
      type: 'url',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
    },

    // FOUNDER SECTION (MANDATORY)
    // Update in /src/sanity/schemas/company.js

    {
      name: 'founders',
      title: 'Founders',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Founder Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'photo',
              title: 'Photo',
              type: 'image',
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'role',
              title: 'Role',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'quote',
              title: 'Quote',
              type: 'text',
              rows: 3,
            },
            {
              name: 'linkedIn',
              title: 'LinkedIn URL',
              type: 'url',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'role',
              media: 'photo',
            },
          },
        },
      ],
    },

    // VISION/INVESTMENT STORY (OPTIONAL)
    {
      name: 'story',
      title: 'Investment Story',
      type: 'object',
      description: 'Deep dive: why we invested or founder vision',
      fields: [
        {
          name: 'title',
          title: 'Story Title',
          type: 'string',
          placeholder: 'Why we invested in [Company]',
        },
        {
          name: 'author',
          title: 'Author',
          type: 'reference',
          to: [{ type: 'teamMember' }],
          description: 'YALI team member or leave blank for founder',
        },
        {
          name: 'content',
          title: 'Story Content',
          type: 'array',
          of: [
            { type: 'block' },
            {
              type: 'image',
              options: { hotspot: true },
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alt text',
                },
                {
                  name: 'caption',
                  type: 'string',
                  title: 'Caption',
                },
              ],
            },
            {
              name: 'pullQuote',
              title: 'Pull Quote',
              type: 'object',
              fields: [
                {
                  name: 'text',
                  title: 'Quote Text',
                  type: 'text',
                  rows: 3,
                },
                {
                  name: 'attribution',
                  title: 'Attribution',
                  type: 'string',
                },
              ],
            },
          ],
        },
      ],
    },

    // KEY METRICS (OPTIONAL)
    {
      name: 'metrics',
      title: 'Key Metrics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              placeholder: 'Funding Raised',
            },
            {
              name: 'value',
              title: 'Value',
              type: 'string',
              placeholder: '$6M',
            },
            {
              name: 'order',
              title: 'Display Order',
              type: 'number',
            },
          ],
        },
      ],
    },

    // INVESTMENT DETAILS (OPTIONAL)
    {
      name: 'investmentDetails',
      title: 'Investment Details',
      type: 'object',
      fields: [
        {
          name: 'date',
          title: 'Investment Date',
          type: 'date',
        },
        {
          name: 'stage',
          title: 'Stage',
          type: 'string',
          options: {
            list: ['Seed', 'Pre-Series A', 'Series A', 'Series B', 'Series C+'],
          },
        },
        {
          name: 'leadInvestor',
          title: 'YALI Lead Investor',
          type: 'boolean',
          initialValue: false,
        },
      ],
    },

    // COMPANY INFO (OPTIONAL)
    {
      name: 'companyInfo',
      title: 'Company Info',
      type: 'object',
      fields: [
        {
          name: 'founded',
          title: 'Founded Year',
          type: 'number',
        },
        {
          name: 'headquarters',
          title: 'Headquarters',
          type: 'string',
        },
        {
          name: 'teamSize',
          title: 'Team Size',
          type: 'string',
          placeholder: '25+',
        },
        {
          name: 'status',
          title: 'Status',
          type: 'string',
          options: {
            list: ['Active', 'Exited', 'Acquired'],
          },
          initialValue: 'Active',
        },
      ],
    },

    // ACHIEVEMENTS (OPTIONAL)
    {
      name: 'achievements',
      title: 'Key Achievements',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'milestone',
              title: 'Milestone',
              type: 'string',
            },
            {
              name: 'date',
              title: 'Date',
              type: 'date',
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
          ],
        },
      ],
    },
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'oneLiner',
      media: 'logo',
    },
  },
};