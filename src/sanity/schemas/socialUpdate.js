const socialUpdate = {
  name: 'socialUpdate',
  title: 'Social Update',
  type: 'document',
  fields: [
    {
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          { title: 'LinkedIn', value: 'linkedin' },
          { title: 'Twitter/X', value: 'twitter' },
          { title: 'Other', value: 'other' },
        ],
      },
      initialValue: 'linkedin',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'url',
      title: 'Post URL',
      type: 'url',
      description: 'Link to the original post',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Post Image',
      type: 'image',
      description: 'Screenshot or image from the post',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'excerpt',
      title: 'Post Blurb',
      type: 'text',
      rows: 5,
      description: 'Content of the post (will be truncated on the frontend)',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'date',
      title: 'Post Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'featuredTeamMember',
      title: 'Featured Team Member',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      description: 'Optional: Link to a team member featured in this post',
    },
    {
      name: 'featuredCompany',
      title: 'Featured Portfolio Company',
      type: 'reference',
      to: [{ type: 'company' }],
      description: 'Optional: Link to a portfolio company featured in this post',
    },
    {
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: true,
      description: 'Show this update on the homepage',
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
      title: 'excerpt',
      subtitle: 'platform',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title?.substring(0, 50) + '...',
        subtitle: subtitle?.toUpperCase(),
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Date, New',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
};

export default socialUpdate;
