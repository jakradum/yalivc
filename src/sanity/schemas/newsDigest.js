const THESES = [
  'Life Sciences',
  'Robotics',
  'Fabless Semiconductor',
  'AI',
  'Smart Manufacturing',
  'Aerospace & Surveillance',
]

// One entry = one news article, stored inside a weekly digest's `items` array.
const intelEntry = {
  name: 'intelEntry',
  title: 'Item',
  type: 'object',
  fields: [
    { name: 'headline', title: 'Headline', type: 'string', validation: (Rule) => Rule.required() },
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
    { name: 'source', title: 'Source', type: 'string', validation: (Rule) => Rule.required() },
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
      description: 'Deep-tech items only',
      options: { list: THESES.map((t) => ({ title: t, value: t })) },
      hidden: ({ parent }) => parent?.category !== 'deep-tech',
    },
    {
      name: 'angle',
      title: 'India angle',
      type: 'string',
      description: 'India-macro items only, e.g. "RBI rate path", "US-India tariffs"',
      hidden: ({ parent }) => parent?.category !== 'india-macro',
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
    { name: 'publishedDate', title: 'Published Date', type: 'date', validation: (Rule) => Rule.required() },
    { name: 'capturedAt', title: 'Captured At', type: 'datetime', validation: (Rule) => Rule.required() },
    { name: 'runId', title: 'Run ID', type: 'string', readOnly: true },
    { name: 'notable', title: 'Notable', type: 'boolean', initialValue: false },
  ],
  preview: {
    select: { title: 'headline', category: 'category', source: 'source', notable: 'notable' },
    prepare({ title, category, source, notable }) {
      const cat = category === 'india-macro' ? 'INDIA MACRO' : 'DEEP TECH'
      return { title: `${notable ? '★ ' : ''}${title}`, subtitle: `${cat} · ${source || 'unknown'}` }
    },
  },
}

// One document per ISO week. The Monday run creates it; the Thursday run
// patches new items in. Written by scripts/news-monitor/upsert.mjs.
const newsDigest = {
  name: 'newsDigest',
  title: 'News Digest (Weekly)',
  type: 'document',
  description:
    'Auto-captured by the twice-weekly news monitor routine. One document per week; deep-tech news across the six theses plus India macro news from credible non-Indian sources. Internal, not on the public site.',
  fields: [
    {
      name: 'weekOf',
      title: 'Week of (Monday)',
      type: 'date',
      description: 'Monday of the ISO week this digest covers',
      validation: (Rule) => Rule.required(),
      readOnly: true,
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "Week of 8 Sep 2026"',
    },
    {
      name: 'runs',
      title: 'Contributing runs',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Run ids that added items to this digest',
      readOnly: true,
    },
    {
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [intelEntry],
    },
  ],
  preview: {
    select: { title: 'title', weekOf: 'weekOf', items: 'items' },
    prepare({ title, weekOf, items = [] }) {
      const dt = items.filter((i) => i.category === 'deep-tech').length
      const im = items.length - dt
      return {
        title: title || `Week of ${weekOf}`,
        subtitle: `${items.length} items · ${dt} deep-tech / ${im} india-macro`,
      }
    },
  },
  orderings: [
    { title: 'Week, newest', name: 'weekDesc', by: [{ field: 'weekOf', direction: 'desc' }] },
  ],
}

export default newsDigest
