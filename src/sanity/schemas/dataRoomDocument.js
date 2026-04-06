export default {
  name: 'dataRoomDocument',
  title: 'Data Room Document',
  type: 'document',

  groups: [
    { name: 'meta', title: 'Document Info' },
    { name: 'file', title: 'File' },
    { name: 'access', title: 'Access' },
    { name: 'internal', title: 'Internal Notes' },
  ],

  fields: [
    // ===== META =====
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'meta',
      validation: Rule => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          { title: 'Pipeline',                    value: 'pipeline' },
          { title: 'PPM and Contribution Agreements', value: 'ppm-agreements' },
          { title: 'Presentations',               value: 'presentations' },
          { title: 'Recommendation',              value: 'recommendation' },
          { title: 'Regulatory Documents',        value: 'regulatory-documents' },
          { title: 'Team',                        value: 'team' },
          { title: 'Track Record',                value: 'track-record' },
        ],
        layout: 'dropdown',
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      group: 'meta',
      description: 'Optional short description shown under the document title',
    },
    {
      name: 'publishedAt',
      title: 'Date',
      type: 'date',
      group: 'meta',
      validation: Rule => Rule.required(),
    },

    // ===== FILE =====
    {
      name: 'file',
      title: 'File',
      type: 'file',
      group: 'file',
      options: {
        accept: 'application/pdf',
      },
      description: 'Upload PDF — follows the same pattern as LP Quarterly Report fund financials',
      validation: Rule => Rule.required(),
    },

    // ===== ACCESS =====
    {
      name: 'accessLevel',
      title: 'Access Level',
      type: 'string',
      group: 'access',
      options: {
        list: [
          {
            title: 'Data Room — all users with data room access',
            value: 'data-room',
          },
          {
            title: 'Restricted — specific users only (V2)',
            value: 'restricted',
          },
        ],
        layout: 'radio',
      },
      initialValue: 'data-room',
      validation: Rule => Rule.required(),
      description: 'Controls who can see this document. "Restricted" is reserved for V2 per-user controls.',
    },

    // ===== INTERNAL NOTES =====
    {
      name: 'internalNotes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3,
      group: 'internal',
      description: 'Studio-only notes. Never returned by any frontend query.',
      // Hidden from all API projections by convention — never included in GROQ queries
    },
  ],

  orderings: [
    {
      title: 'Date, newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Category A–Z',
      name: 'categoryAsc',
      by: [{ field: 'category', direction: 'asc' }],
    },
  ],

  preview: {
    select: {
      title: 'title',
      category: 'category',
      accessLevel: 'accessLevel',
      date: 'publishedAt',
    },
    prepare({ title, category, accessLevel, date }) {
      const categoryLabels = {
        'pipeline': 'Pipeline',
        'ppm-agreements': 'PPM & Agreements',
        'presentations': 'Presentations',
        'recommendation': 'Recommendation',
        'regulatory-documents': 'Regulatory Documents',
        'team': 'Team',
        'track-record': 'Track Record',
      };
      return {
        title: title,
        subtitle: [
          categoryLabels[category] || category,
          accessLevel === 'restricted' ? '🔒 Restricted' : '',
          date || '',
        ].filter(Boolean).join(' · '),
      };
    },
  },
};
