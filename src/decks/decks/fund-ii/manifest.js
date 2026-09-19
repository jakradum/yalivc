// Phase 5: every slide from the legacy deck's named-section map now has
// an entry (see DECK_MIGRATION_PLAN.md). Slide order and copy live in
// code, not Sanity.
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
    { id: 'investment-areas', type: 'thesis-hub', build: (d) => d.thesis },

    { id: 'process-divider', type: 'section-divider', build: () => ({ heading: 'Our\nProcess' }) },
    { id: 'inbound-dealflow', type: 'dealflow', build: (d) => d.dealflow },
    { id: 'portfolio-support', type: 'portfolio-support', build: (d) => d.portfolioSupport },

    { id: 'fund-i-divider', type: 'section-divider', build: () => ({ heading: 'Fund\nI' }) },
    { id: 'fund-i-portfolio', type: 'portfolio-grid', build: (d) => d.fundIPortfolio },
    { id: 'tech-cxo-map', type: 'cxo-map', build: (d) => d.cxoMap },

    { id: 'fund-ii-divider', type: 'section-divider', build: () => ({ heading: 'Fund\nII' }) },
    { id: 'proposed-structure', type: 'governance', build: (d) => d.governance },
    { id: 'fund-ii-key-terms', type: 'key-terms', build: (d) => d.fundIIKeyTerms },
    { id: 'fund-ii-deployment', type: 'deployment', build: (d) => d.fundIIDeployment },

    { id: 'media-recognition', type: 'media-grid', build: (d) => d.media },
    { id: 'closing', type: 'closing', build: (d) => d.closing },
  ],
};
