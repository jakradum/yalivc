export default {
  name: 'sector',
  title: 'Sectors',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Sector Name',
      type: 'string',
      readOnly: true,
      description: 'Pre-set sector name'
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      readOnly: true,
      description: 'Pre-set URL slug'
    },
    {
      name: 'iconName',
      title: 'Icon',
      type: 'string',
      readOnly: true,
      description: 'Auto-assigned icon from /src/app/components/icons/category svgs/'
    },
    {
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: '4-5 lines for sector grid card',
      validation: Rule => Rule.max(250).required()
    },
    {
      name: 'overview',
      title: 'Sector Overview',
      type: 'array',
      description: 'Structure: 1) Market landscape 2) Key trends 3) Technology drivers 4) India opportunity. Max 400 words.',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'}
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'}
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'URL',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url'
                  }
                ]
              }
            ]
          }
        }
      ],
      validation: Rule => Rule.required().custom(blocks => {
        if (!blocks) return true;
        const text = blocks
          .filter(block => block._type === 'block')
          .map(block => block.children?.map(child => child.text).join(''))
          .join(' ');
        const wordCount = text.trim().split(/\s+/).length;
        return wordCount <= 400 ? true : `Overview is ${wordCount} words. Please keep it under 400 words.`;
      })
    },
    {
      name: 'whyYALICares',
      title: 'Why YALI Cares (Investment Thesis)',
      type: 'array',
      description: 'YALI\'s specific investment thesis for this sector. Max 1000 words.',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H3', value: 'h3'}
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'}
            ]
          }
        }
      ],
      validation: Rule => Rule.required().custom(blocks => {
        if (!blocks) return true;
        const text = blocks
          .filter(block => block._type === 'block')
          .map(block => block.children?.map(child => child.text).join(''))
          .join(' ');
        const wordCount = text.trim().split(/\s+/).length;
        return wordCount <= 1000 ? true : `Investment thesis is ${wordCount} words. Please keep it under 1000 words.`;
      })
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'shortDescription'
    }
  }
}