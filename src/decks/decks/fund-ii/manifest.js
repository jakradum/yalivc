// Phase 1: one slide, to prove the pipeline. Phase 4 fills in every
// slide from the legacy deck's named-section map (see
// DECK_MIGRATION_PLAN.md). Slide order lives here, in code — not in
// Sanity ("facts in Sanity, rhetoric in code", decided earlier).
export const fundIIDeck = {
  id: 'fund-ii',
  title: 'Yali Capital Fund II',
  slides: [
    {
      id: 'cover',
      type: 'cover',
      build: (data) => ({
        title: data.cover.title,
        subtitle: data.cover.subtitle,
      }),
    },
  ],
};
