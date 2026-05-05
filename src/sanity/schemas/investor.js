/**
 * Investor Schema
 *
 * Centralized list of investors (VCs, angels, family offices, etc.)
 * Similar to publications - a reusable reference across portfolio companies.
 */
export default {
  name: 'investor',
  title: 'Investors',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Investor Name',
      type: 'string',
      description: 'e.g., "Sequoia Capital", "Kalaari Capital", "Angel Investor Name"',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'type',
      title: 'Investor Type',
      type: 'string',
      options: {
        list: [
          { title: 'Venture Capital', value: 'vc' },
          { title: 'Angel Investor', value: 'angel' },
          { title: 'Family Office', value: 'family-office' },
          { title: 'Corporate/Strategic', value: 'corporate' },
          { title: 'Government/Institutional', value: 'government' },
          { title: 'Other', value: 'other' },
        ],
      },
    },
    {
      name: 'website',
      title: 'Website',
      type: 'url',
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
      media: 'logo',
    },
    prepare({ title, subtitle, media }) {
      const typeLabels = {
        'vc': 'VC',
        'angel': 'Angel',
        'family-office': 'Family Office',
        'corporate': 'Corporate',
        'government': 'Govt/Institutional',
        'other': 'Other',
      };
      return {
        title,
        subtitle: typeLabels[subtitle] || subtitle,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
}
