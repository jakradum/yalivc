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
      description: 'Reference existing Data Room documents from the Recommendation category',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'dataRoomDocument' }] }],
    },
  ],
  preview: {
    prepare() {
      return { title: 'Data Room Fund Content' };
    },
  },
}
