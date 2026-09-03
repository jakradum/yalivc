const THESES = [
  'Life Sciences',
  'Robotics',
  'Fabless Semiconductor',
  'AI',
  'Smart Manufacturing',
  'Aerospace & Surveillance',
]

const intelItem = {
  name: 'intelItem',
  title: 'Intel Item (News Monitor)',
  type: 'document',
  description:
    'Auto-captured by the twice-weekly news monitor routine. Deep-tech news and India macro news from credible non-Indian sources. Not shown on the public site.',
  fields: [
    {
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'url',
      title: 'Article URL',
      type: 'string',
      validation: (Rule) =>
        Rule.required().custom((val) => {
          if (!val) return true
          const url = /^https?:\/\//i.test(val) ? val : `https://${val}`
          try {
            new URL(url)
            return true
          } catch {
            return 'Please enter a valid URL'
          }
        }),
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Publication or institution name',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Deep tech', value: 'deep-tech' },
          { title: 'India macro', value: 'india-macro' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'thesis',
      title: 'Thesis',
      type: 'string',
      description: 'Deep-tech items only: best-fit Yali thesis',
      options: {
        list: THESES.map((t) => ({ title: t, value: t })),
      },
      hidden: ({ document }) => document?.category !== 'deep-tech',
    },
    {
      name: 'angle',
      title: 'India angle',
      type: 'string',
      description:
        'India-macro items only: short tag for the India hook (e.g. "RBI rate path", "US-India tariffs", "Fitch outlook")',
      hidden: ({ document }) => document?.category !== 'india-macro',
    },
    {
      name: 'summary',
      title: 'Summary',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        '3 to 6 thorough bullets: what happened, context, mechanism, why it matters for Yali, what to watch next.',
      validation: (Rule) => Rule.required().min(3).max(6),
    },
    {
      name: 'publishedDate',
      title: 'Published Date',
      type: 'date',
      description: "The article's publication date",
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'capturedAt',
      title: 'Captured At',
      type: 'datetime',
      description: 'When the monitor routine recorded this item',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'runId',
      title: 'Run ID',
      type: 'string',
      description: 'Monitor run that captured this item, e.g. 2026-09-07-mon',
      readOnly: true,
    },
    {
      name: 'notable',
      title: 'Notable',
      type: 'boolean',
      description:
        'Major policy shift, large round in a Yali sector, ratings action, or national-scale capex',
      initialValue: false,
    },
  ],
  preview: {
    select: {
      title: 'headline',
      category: 'category',
      source: 'source',
      date: 'publishedDate',
      notable: 'notable',
    },
    prepare({ title, category, source, date, notable }) {
      const cat = category === 'india-macro' ? 'INDIA MACRO' : 'DEEP TECH'
      const d = date ? new Date(date).toLocaleDateString() : ''
      return {
        title: `${notable ? '★ ' : ''}${title}`,
        subtitle: `${cat} · ${source || 'unknown'} · ${d}`,
      }
    },
  },
  orderings: [
    {
      title: 'Captured, newest',
      name: 'capturedDesc',
      by: [{ field: 'capturedAt', direction: 'desc' }],
    },
    {
      title: 'Published, newest',
      name: 'publishedDesc',
      by: [{ field: 'publishedDate', direction: 'desc' }],
    },
  ],
}

export default intelItem
