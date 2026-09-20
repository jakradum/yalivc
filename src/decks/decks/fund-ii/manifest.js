// Phase 5: every slide from the legacy deck's named-section map now has
// an entry (see DECK_MIGRATION_PLAN.md). Slide order and copy live in
// code, not Sanity.
export const fundIIDeck = {
  id: 'fund-ii',
  title: 'Yali Capital Fund II',
  slides: [
    { id: 'cover', type: 'cover', build: (d) => d.cover },
    { id: 'contents', type: 'contents', build: (d) => d.contents },

    { id: 'team-divider', type: 'section-divider', build: () => ({ heading: 'The\nYali\nTeam', pattern: 1 }) },
    { id: 'team-overview', type: 'team-grid', build: (d) => d.teamOverview },
    { id: 'gps-advisor', type: 'person-grid', build: (d) => d.gpsAdvisor },
    { id: 'investments-team', type: 'person-grid', build: (d) => d.investmentsTeam },
    { id: 'operations-team', type: 'person-grid', build: (d) => d.operationsTeam },

    { id: 'thesis-divider', type: 'section-divider', build: () => ({ heading: 'Our\nThesis', pattern: 2 }) },
    { id: 'investment-areas', type: 'thesis-hub', build: (d) => d.thesis },

    { id: 'process-divider', type: 'section-divider', build: () => ({ heading: 'Our\nProcess', sub: 'How we source, evaluate and back', pattern: 3 }) },
    { id: 'inbound-dealflow', type: 'dealflow', build: (d) => d.dealflow },
    { id: 'portfolio-support', type: 'portfolio-support', build: (d) => d.portfolioSupport },

    { id: 'fund-i-divider', type: 'section-divider', build: () => ({ heading: 'Fund I', sub: 'Performance · Last updated: June 2026', pattern: 4 }) },
    { id: 'fund-i-portfolio', type: 'portfolio-table', build: (d) => d.fundIPortfolio },
    { id: 'tech-cxo-map', type: 'cxo-map', build: (d) => d.cxoMap },

    { id: 'fund-ii-divider', type: 'section-divider', build: () => ({ heading: 'Fund\nII', sub: 'Structure & Terms', pattern: 5 }) },
    { id: 'proposed-structure', type: 'governance', build: (d) => d.governance },
    { id: 'fund-ii-key-terms', type: 'key-terms', build: (d) => d.fundIIKeyTerms },
    { id: 'fund-ii-deployment', type: 'deployment', build: (d) => d.fundIIDeployment },

    { id: 'media-recognition', type: 'media-grid', build: (d) => d.media },
    // Legacy splits the appendix 4 + 3 companies across two slides. Page two
    // returns null (and is skipped) when there are four or fewer companies.
    { id: 'appendix-portfolio', type: 'portfolio-grid', build: (d) => ({ companies: d.appendixPortfolio.companies.slice(0, 4) }) },
    {
      id: 'appendix-portfolio-2',
      type: 'portfolio-grid',
      build: (d) => (d.appendixPortfolio.companies.length > 4 ? { companies: d.appendixPortfolio.companies.slice(4, 8) } : null),
    },
    { id: 'closing', type: 'closing', build: (d) => d.closing },
  ],
};
