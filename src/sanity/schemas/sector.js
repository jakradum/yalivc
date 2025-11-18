import {portableTextConfig} from './portableTextConfig';

export default {
  name: 'sector',
  title: 'Sectors',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Sector Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Link this sector to its parent category',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: Rule => Rule.required()
    },
    {
      name: 'iconName',
      title: 'Icon',
      type: 'string',
      description: 'Auto-assigned icon from /src/app/components/icons/category svgs/',
    },
    {
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: '4-5 lines for sector grid card',
      validation: Rule => Rule.max(250).required(),
    },
    {
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Show this sector on the website',
      initialValue: true,
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first'
    },
    {
      name: 'overview',
      title: 'Sector Overview',
      description: 'Structure: 1) Market landscape 2) Key trends 3) Technology drivers 4) India opportunity. Max 400 words.',
      ...portableTextConfig,
      validation: Rule => Rule.required().custom(blocks => {
        if (!blocks) return true;
        const text = blocks
          .filter(block => block._type === 'block')
          .map(block => block.children?.map(child => child.text).join(''))
          .join(' ');
        const wordCount = text.trim().split(/\s+/).length;
        return wordCount <= 400 || `Overview is ${wordCount} words. Keep under 400.`;
      }),
    },
    {
      name: 'whyYALICares',
      title: 'Why YALI Cares (Investment Thesis)',
      description: "YALI's specific investment thesis for this sector. Max 1000 words.",
      ...portableTextConfig,
      validation: Rule => Rule.required().custom(blocks => {
        if (!blocks) return true;
        const text = blocks
          .filter(block => block._type === 'block')
          .map(block => block.children?.map(child => child.text).join(''))
          .join(' ');
        const wordCount = text.trim().split(/\s+/).length;
        return wordCount <= 1000 || `Thesis is ${wordCount} words. Keep under 1000.`;
      }),
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'shortDescription',
    },
  },
};
