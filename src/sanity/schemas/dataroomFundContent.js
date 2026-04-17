export default {
  name: 'dataroomFundContent',
  title: 'Data Room Fund Content',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    // ── Fund I ────────────────────────────────────────────────────────────────
    {
      name: 'fundISlideDeck',
      title: 'Fund I — Slide Deck',
      type: 'file',
      options: { accept: '.pdf' },
    },
    {
      name: 'fundILpReport',
      title: 'Fund I — LP Report',
      description: 'Reference to the compiled LP quarterly report for Fund I',
      type: 'reference',
      to: [{ type: 'lpQuarterlyReport' }],
    },

    // ── Fund II ───────────────────────────────────────────────────────────────
    {
      name: 'fundIIThesisPresentation',
      title: 'Fund II — Thesis Presentation',
      type: 'file',
      options: { accept: '.pdf' },
    },

    // ── Common ────────────────────────────────────────────────────────────────
    {
      name: 'commonTeamMembers',
      title: 'Common — Team Members',
      description: 'Investment team profiles shown in the Data Room',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'teamMember' }] }],
    },
    {
      name: 'commonTrackRecord',
      title: 'Common — Track Record',
      type: 'file',
      options: { accept: '.pdf' },
    },
    {
      name: 'commonRecommendationDocuments',
      title: 'Common — Recommendation Documents',
      description: 'Upload individual PDF documents to include in the Others section of the data room.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Document Title',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'file',
              title: 'PDF File',
              type: 'file',
              options: { accept: '.pdf' },
              validation: Rule => Rule.required(),
            },
          ],
          preview: {
            select: { title: 'title' },
            prepare({ title }) {
              return { title: title || 'Untitled document' };
            },
          },
        },
      ],
    },

    // ── Track Record Settings ─────────────────────────────────────────────────
    {
      name: 'exitValueAsOfDate',
      title: 'Track Record — Exit Value "As of" Date',
      type: 'string',
      description: 'Shown as fine print under the Exit Value column header (e.g. "15 Jul \'24"). Leave blank to hide.',
    },
    {
      name: 'hiddenFunds',
      title: 'Track Record — Hide Records by Fund / Org',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Enter exact Fund / Org values whose records should be hidden (e.g. "Fund 2"). Case-sensitive.',
    },
  ],
  preview: {
    prepare() {
      return { title: 'Data Room Fund Content' };
    },
  },
}
