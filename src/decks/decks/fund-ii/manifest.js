// Phase 3: every non-diagram slide, in the legacy deck's order (see the
// named-section map in DECK_MIGRATION_PLAN.md). Hub-and-spoke thesis
// slide, inbound-dealflow, portfolio-support, proposed-structure, and
// CXO-map are deliberately NOT here yet — bespoke, high-effort, one-off
// visuals, correctly deferred to Phase 4 per the "don't componentize
// every div" rule. Slide order and copy live in code, not Sanity.
export const fundIIDeck = {
  id: 'fund-ii',
  title: 'Yali Capital Fund II',
  slides: [
    { id: 'cover', type: 'cover', build: (d) => d.cover },
    { id: 'contents', type: 'contents', build: (d) => d.contents },

    { id: 'team-divider', type: 'section-divider', build: () => ({ heading: 'Team' }) },
    { id: 'team-overview', type: 'team-grid', build: (d) => d.teamOverview },
    { id: 'investments-team', type: 'person-grid', build: (d) => d.investmentsTeam },

    { id: 'thesis-divider', type: 'section-divider', build: () => ({ heading: 'Thesis' }) },
    // 'investment-areas' (HubAndSpoke) — Phase 4.

    { id: 'process-divider', type: 'section-divider', build: () => ({ heading: 'Our\nProcess' }) },
    // 'inbound-dealflow', 'portfolio-support' — Phase 4 (bespoke).

    { id: 'fund-i-divider', type: 'section-divider', build: () => ({ heading: 'Fund\nI' }) },
    { id: 'fund-i-portfolio', type: 'portfolio-grid', build: (d) => d.fundIPortfolio },

    { id: 'fund-ii-divider', type: 'section-divider', build: () => ({ heading: 'Fund\nII' }) },
    // 'proposed-structure' — Phase 4 (bespoke SVG org chart).
    { id: 'fund-ii-key-terms', type: 'key-terms', build: (d) => d.fundIIKeyTerms },
    { id: 'fund-ii-deployment', type: 'deployment', build: (d) => d.fundIIDeployment },

    { id: 'media-recognition', type: 'media-grid', build: (d) => d.media },
    { id: 'closing', type: 'closing', build: (d) => d.closing },
  ],
};
