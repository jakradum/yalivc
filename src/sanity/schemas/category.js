export default {
  name: 'category',
  title: 'Investment Categories',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Category Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Show this category on the website',
      initialValue: true,
    },
    {
      name: 'overview',
      title: 'Overview',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'whyYALICares',
      title: 'Why YALI Cares',
      type: 'array',
      of: [{ type: 'block' }],
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
      subtitle: 'description',
    },
  },
};