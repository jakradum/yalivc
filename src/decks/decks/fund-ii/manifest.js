// Phase 5: every slide from the legacy deck's named-section map now has
// an entry (see DECK_MIGRATION_PLAN.md). Slide order and copy live in
// code, not Sanity.
import { generatedDate } from '@/decks/core/deckVersion';

export const fundIIDeck = {
  id: 'fund-ii',
  title: 'Yali Capital Fund II',
  slides: [
    // `section` on a slide starts a section: every following slide (until the
    // next one) gets that label as its top-right breadcrumb, as in the legacy
    // deck. Order mirrors the legacy deck exactly.
    { id: 'cover', type: 'cover', build: (d) => ({ ...d.cover, stamp: generatedDate() }) },
    { id: 'contents', type: 'contents', build: (d) => d.contents },

    { id: 'team-divider', type: 'section-divider', section: 'Team', build: () => ({ heading: 'The\nYali\nTeam', pattern: 1 }) },
    // Team photo grid dropped in v3.4 (Gani, 22 Nov 2026): it repeated the three profile slides after it.
    // { id: 'team-overview', type: 'team-grid', build: (d) => d.teamOverview },
    { id: 'gps-advisor', type: 'person-grid', build: (d) => d.gpsAdvisor },
    { id: 'investments-team', type: 'person-grid', build: (d) => d.investmentsTeam },
    { id: 'operations-team', type: 'person-grid', build: (d) => d.operationsTeam },

    { id: 'thesis-divider', type: 'section-divider', section: 'Thesis', build: () => ({ heading: 'Our\nThesis', pattern: 2 }) },
    { id: 'investment-areas', type: 'thesis-hub', build: (d) => d.thesis },

    { id: 'process-divider', type: 'section-divider', section: 'Process', build: () => ({ heading: 'Our\nProcess', sub: 'How we source, evaluate and back', pattern: 3 }) },
    { id: 'inbound-dealflow', type: 'dealflow', build: (d) => d.dealflow },
    { id: 'portfolio-support', type: 'portfolio-support', build: (d) => d.portfolioSupport },

    { id: 'fund-i-divider', type: 'section-divider', section: 'Fund I', build: () => ({ heading: 'Fund I', sub: 'Performance · Last updated: June 2026', pattern: 4 }) },
    { id: 'fund-i-dealflow', type: 'dealflow-summary', build: (d) => d.fundIDealflow },
    { id: 'fund-i-stats', type: 'fund-stats', build: (d) => d.fundIStats },
    { id: 'fund-i-sectors', type: 'sector-pie', build: (d) => d.fundISectors },
    { id: 'fund-i-portfolio', type: 'portfolio-table', build: (d) => d.fundIPortfolio },
    // Logos come from the portfolio table rows, so they're set in one place.
    {
      id: 'fund-i-realised-exits',
      type: 'realised-exits',
      build: (d) =>
        d.fundIRealisedExits && {
          ...d.fundIRealisedExits,
          rows: d.fundIRealisedExits.rows.map((r) => ({ ...r, logoUrl: d.fundIPortfolio.rows.find((p) => p.name === r.name)?.logoUrl })),
        },
    },
    { id: 'limited-partners', type: 'lp-logos', build: (d) => d.lpLogos },
    { id: 'tech-cxo-map', type: 'cxo-map', build: (d) => d.cxoMap },
    { id: 'fund-i-near-term', type: 'near-term', build: (d) => d.fundINearTerm },

    { id: 'fund-ii-divider', type: 'section-divider', section: 'Fund II', build: () => ({ heading: 'Fund\nII', sub: 'Structure & Terms', pattern: 5 }) },
    { id: 'proposed-structure', type: 'governance', build: (d) => d.governance },
    { id: 'fund-ii-key-terms', type: 'key-terms', build: (d) => d.fundIIKeyTerms },
    { id: 'fund-ii-structure-title', type: 'title', build: (d) => d.fundIIStructureTitle },
    { id: 'fund-ii-deployment', type: 'deployment', build: (d) => d.fundIIDeployment },

    // The media slide opens its own section; it shows no breadcrumb itself.
    { id: 'media-recognition', type: 'media-grid', section: 'Media', build: (d) => d.media },
    { id: 'closing', type: 'closing', build: (d) => d.closing },

    { id: 'appendix-divider', type: 'section-divider', section: 'Portfolio', build: () => ({ heading: 'Port-\nfolio', sub: 'Fund I · Company detail', pattern: 6 }) },
    // Three companies per slide (Fund I is at nine). A page whose slice is
    // empty returns null and is skipped.
    ...[0, 1, 2].map((i) => ({
      id: i ? `appendix-portfolio-${i + 1}` : 'appendix-portfolio',
      type: 'portfolio-grid',
      build: (d) => {
        const companies = d.appendixPortfolio.companies.slice(i * 3, i * 3 + 3);
        return companies.length ? { companies } : null;
      },
    })),
    { id: 'end-logomark', type: 'logomark', build: () => ({}) },
  ],
};
